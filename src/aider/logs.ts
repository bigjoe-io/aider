'use client'

/**
 * Shared Aider event indexer.
 *
 * One indexer per (chain, contract, deployBlock), shared by every component that calls useAiderLogs().
 * It scans [deployBlock, latest] with eth_getLogs in 9,500-block chunks (Arc caps a query at 10,000
 * blocks), 2 requests at a time, halving a chunk when the RPC complains about the range and backing off on 429s. Logs are
 * decoded with parseEventLogs(AIDER_ABI), de-duplicated, sorted, and persisted to localStorage
 * (bigint-safe, versioned key) so a reload resumes from the last scanned block. After catching up
 * it polls for new blocks every 15 s. Inert (empty, not loading) when no contract is configured.
 *
 * Nothing touches `window` at import time, so this module is safe to import from client components
 * that are also pre-rendered on the server.
 */
import { useSyncExternalStore } from 'react'
import { parseEventLogs, type Hash, type ParseEventLogsReturnType, type PublicClient } from 'viem'
import { getPublicClient } from 'wagmi/actions'
import { config } from '@/config'
import { AIDER_ABI } from './abi'
import { AIDER_ADDRESS, AIDER_CHAIN_ID, AIDER_DEPLOY_BLOCK } from './config'

// ---------------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------------
type Decoded = ParseEventLogsReturnType<typeof AIDER_ABI, undefined, true>[number]
type Slim<T> = T extends { eventName: infer N; args: infer A }
  ? { eventName: N; args: A; blockNumber: bigint; transactionHash: Hash; logIndex: number }
  : never

/** A decoded Aider event (discriminated union on `eventName`). */
export type AiderLog = Slim<Decoded>
export type AiderEventName = AiderLog['eventName']
export type AiderLogOf<N extends AiderEventName> = Extract<AiderLog, { eventName: N }>

export interface AiderLogsState {
  logs: readonly AiderLog[]
  /** True until the first full scan finishes when nothing was cached. */
  isLoading: boolean
  /** True while any scan (initial or poll) is running. */
  isSyncing: boolean
  /** 0–1 progress of the current catch-up scan. */
  progress: number
  error: Error | null
  /** Last block included in `logs`; null before anything is scanned. */
  lastScannedBlock: bigint | null
  /** Highest chain block seen. */
  latestBlock: bigint | null
}

// ---------------------------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------------------------
export const LOG_CHUNK_BLOCKS = 9_500n
const MIN_CHUNK_BLOCKS = 50n
const CONCURRENCY = 2
const POLL_MS = 15_000
const STORAGE_VERSION = 2
const STORAGE_PREFIX = 'aider-logs'

const INERT: AiderLogsState = Object.freeze({
  logs: Object.freeze([]),
  isLoading: false,
  isSyncing: false,
  progress: 1,
  error: null,
  lastScannedBlock: null,
  latestBlock: null,
})

// ---------------------------------------------------------------------------------------------
// bigint-safe persistence
// ---------------------------------------------------------------------------------------------
interface Persisted {
  v: number
  key: string
  lastScannedBlock: bigint
  logs: AiderLog[]
}

function replacer(_k: string, v: unknown): unknown {
  return typeof v === 'bigint' ? { __b: v.toString() } : v
}
function reviver(_k: string, v: unknown): unknown {
  if (v && typeof v === 'object' && '__b' in v) {
    const b = (v).__b
    if (typeof b === 'string' && /^-?\d+$/.test(b)) return BigInt(b)
  }
  return v
}

export function serializeBigint(value: unknown): string {
  return JSON.stringify(value, replacer)
}
export function deserializeBigint<T>(text: string): T {
  return JSON.parse(text, reviver) as T
}

// ---------------------------------------------------------------------------------------------
// Indexer
// ---------------------------------------------------------------------------------------------
function errorText(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  const e = err as Error & { details?: string; status?: number; cause?: { status?: number } }
  return `${e.message} ${e.details ?? ''} ${e.status ?? ''} ${e.cause?.status ?? ''}`
}

/** The RPC asked us to slow down (HTTP 429). Retry the same range later; never split it. */
function isRateLimitError(err: unknown): boolean {
  return /\b429\b|too many requests|rate[ -]?limit/i.test(errorText(err))
}

/** The RPC refused the block span (Arc: "requested range too large"). Split the range. */
function isRangeError(err: unknown): boolean {
  if (isRateLimitError(err)) return false
  return /range|exceed|10[,_]?000|block.*(span|count)|response size|query returned more|too many (logs|results|blocks)/i.test(errorText(err))
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const RATE_LIMIT_RETRIES = 6

function logKey(l: { transactionHash: string; logIndex: number }): string {
  return `${l.transactionHash}:${l.logIndex}`
}

function compareLogs(a: AiderLog, b: AiderLog): number {
  if (a.blockNumber !== b.blockNumber) return a.blockNumber < b.blockNumber ? -1 : 1
  return a.logIndex - b.logIndex
}

class AiderIndexer {
  readonly storageKey: string
  private state: AiderLogsState
  private listeners = new Set<() => void>()
  private seen = new Set<string>()
  private timer: number | null = null
  private running: Promise<void> | null = null
  private started = false
  private persistTimer: number | null = null

  constructor(
    private readonly chainId: number,
    private readonly address: `0x${string}`,
    private readonly deployBlock: bigint,
  ) {
    this.storageKey = `${STORAGE_PREFIX}:v${STORAGE_VERSION}:${chainId}:${address.toLowerCase()}:${deployBlock.toString()}`
    this.state = { ...INERT, isLoading: true, progress: 0 }
  }

  getState = (): AiderLogsState => this.state

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb)
    if (!this.started) this.start()
    return () => {
      this.listeners.delete(cb)
    }
  }

  /** Scan for new blocks now (e.g. right after a transaction is confirmed). */
  refresh = (): Promise<void> => this.sync()

  private set(patch: Partial<AiderLogsState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((l) => l())
  }

  private start() {
    this.started = true
    this.restore()
    void this.sync()
  }

  private restore() {
    try {
      const raw = window.localStorage.getItem(this.storageKey)
      if (!raw) return
      const data = deserializeBigint<Persisted>(raw)
      if (data.v !== STORAGE_VERSION || data.key !== this.storageKey || typeof data.lastScannedBlock !== 'bigint') return
      const logs = [...data.logs].sort(compareLogs)
      logs.forEach((l) => this.seen.add(logKey(l)))
      this.state = { ...this.state, logs, lastScannedBlock: data.lastScannedBlock, isLoading: false, progress: 1 }
    } catch {
      // corrupt cache: rescan
    }
    // drop stale caches for this contract (older storage version or a different deploy block)
    try {
      const mine = `:${this.chainId}:${this.address.toLowerCase()}:`
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith(`${STORAGE_PREFIX}:`) && k !== this.storageKey && k.includes(mine)) {
          window.localStorage.removeItem(k)
        }
      }
    } catch {
      // ignore
    }
  }

  private persistSoon() {
    if (this.persistTimer !== null) return
    this.persistTimer = window.setTimeout(() => {
      this.persistTimer = null
      this.persist()
    }, 500)
  }

  private persist() {
    const { lastScannedBlock, logs } = this.state
    if (lastScannedBlock === null) return
    const data: Persisted = { v: STORAGE_VERSION, key: this.storageKey, lastScannedBlock, logs: [...logs] }
    try {
      window.localStorage.setItem(this.storageKey, serializeBigint(data))
    } catch {
      // quota exceeded or storage blocked: indexer keeps working in memory
    }
  }

  private schedule() {
    if (this.timer !== null) window.clearTimeout(this.timer)
    this.timer = window.setTimeout(() => {
      this.timer = null
      if (typeof document !== 'undefined' && document.hidden) {
        this.schedule()
        return
      }
      void this.sync()
    }, POLL_MS)
  }

  private sync(): Promise<void> {
    if (this.running) return this.running
    this.running = this.scan()
      .catch((err: unknown) => {
        this.set({ error: err instanceof Error ? err : new Error(String(err)), isLoading: false, isSyncing: false })
      })
      .finally(() => {
        this.running = null
        this.schedule()
      })
    return this.running
  }

  private client(): PublicClient {
    const c = getPublicClient(config, { chainId: this.chainId })
    if (!c) throw new Error(`No RPC client for chain ${this.chainId}`)
    return c
  }

  private async fetchRange(client: PublicClient, from: bigint, to: bigint, attempt = 0): Promise<AiderLog[]> {
    try {
      const raw = await client.getLogs({ address: this.address, fromBlock: from, toBlock: to })
      const decoded = parseEventLogs({ abi: AIDER_ABI, logs: raw, strict: true })
      return decoded.map(
        (l) =>
          ({
            eventName: l.eventName,
            args: l.args,
            blockNumber: l.blockNumber,
            transactionHash: l.transactionHash,
            logIndex: l.logIndex,
          }) as AiderLog,
      )
    } catch (err) {
      if (isRateLimitError(err) && attempt < RATE_LIMIT_RETRIES) {
        // 0.5 s, 1 s, 2 s … with jitter, so parallel chunks don't retry in lockstep.
        await sleep(500 * 2 ** attempt + Math.random() * 250)
        return this.fetchRange(client, from, to, attempt + 1)
      }
      const span = to - from + 1n
      if (isRangeError(err) && span > MIN_CHUNK_BLOCKS) {
        const mid = from + span / 2n - 1n
        const [a, b] = await Promise.all([this.fetchRange(client, from, mid), this.fetchRange(client, mid + 1n, to)])
        return [...a, ...b]
      }
      throw err
    }
  }

  private async scan() {
    const client = this.client()
    this.set({ isSyncing: true })
    const latest = await client.getBlockNumber({ cacheTime: 0 })
    const start = this.state.lastScannedBlock === null ? this.deployBlock : this.state.lastScannedBlock + 1n
    if (start > latest) {
      this.set({ isSyncing: false, isLoading: false, progress: 1, error: null, latestBlock: latest })
      return
    }
    const total = Number(latest - start + 1n)

    // Windows of CONCURRENCY chunks, each committed in order so lastScannedBlock stays contiguous.
    let cursor = start
    while (cursor <= latest) {
      const ranges: Array<[bigint, bigint]> = []
      for (let i = 0; i < CONCURRENCY && cursor <= latest; i++) {
        const end = cursor + LOG_CHUNK_BLOCKS - 1n > latest ? latest : cursor + LOG_CHUNK_BLOCKS - 1n
        ranges.push([cursor, end])
        cursor = end + 1n
      }
      const results = await Promise.all(ranges.map(([f, t]) => this.fetchRange(client, f, t)))
      const fresh: AiderLog[] = []
      for (const l of results.flat()) {
        const k = logKey(l)
        if (this.seen.has(k)) continue
        this.seen.add(k)
        fresh.push(l)
      }
      const last = ranges[ranges.length - 1][1]
      const logs = fresh.length ? [...this.state.logs, ...fresh].sort(compareLogs) : this.state.logs
      this.set({
        logs,
        lastScannedBlock: last,
        latestBlock: latest,
        progress: Math.min(1, Number(last - start + 1n) / total),
        error: null,
      })
      if (fresh.length || last === latest) this.persistSoon()
    }
    this.set({ isSyncing: false, isLoading: false, progress: 1 })
  }
}

const indexers = new Map<string, AiderIndexer>()

/** The shared indexer for the configured contract, or null when none is configured / on the server. */
export function getAiderIndexer(): AiderIndexer | null {
  if (!AIDER_ADDRESS || typeof window === 'undefined') return null
  const key = `${AIDER_CHAIN_ID}:${AIDER_ADDRESS}:${AIDER_DEPLOY_BLOCK.toString()}`
  let idx = indexers.get(key)
  if (!idx) {
    idx = new AiderIndexer(AIDER_CHAIN_ID, AIDER_ADDRESS, AIDER_DEPLOY_BLOCK)
    indexers.set(key, idx)
  }
  return idx
}

/** Ask the shared indexer to scan new blocks now. No-op when inert. */
export function refreshAiderLogs(): Promise<void> {
  return getAiderIndexer()?.refresh() ?? Promise.resolve()
}

const noopSubscribe = () => () => {}
const inertSnapshot = () => INERT

/**
 * All decoded Aider events, oldest first. Renders progressively while the indexer catches up.
 * Server render / no contract: `{ logs: [], isLoading: false, … }`.
 */
export function useAiderLogs(): AiderLogsState {
  const idx = typeof window === 'undefined' ? null : getAiderIndexer()
  return useSyncExternalStore(idx ? idx.subscribe : noopSubscribe, idx ? idx.getState : inertSnapshot, inertSnapshot)
}

/** Narrow a log list to one event type. */
export function filterLogs<N extends AiderEventName>(logs: readonly AiderLog[], name: N): AiderLogOf<N>[] {
  return logs.filter((l): l is AiderLogOf<N> => l.eventName === name)
}
