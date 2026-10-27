'use client'

/**
 * React hooks for the Aider contract. Every read and write is pinned to AIDER_CHAIN_ID.
 * Reads use react-query (via wagmi); event-derived data comes from the shared log indexer (logs.ts).
 */
import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { readContracts, simulateContract, waitForTransactionReceipt, getPublicClient } from 'wagmi/actions'
import { toast } from 'sonner'
import type {
  Address,
  ContractFunctionArgs,
  ContractFunctionName,
  Hash,
  TransactionReceipt,
} from 'viem'
import { parseAbi } from 'viem'
import { config } from '@/config'
import { useNow } from '@/lib/hooks'
import { AIDER_ABI, ERC20_ABI } from './abi'
import { AIDER_ADDRESS, AIDER_CHAIN_ID, AIDER_CHAIN_NAME, USDC_ADDRESS, explorerTx } from './config'
import { decodeAiderError, TransactionRevertedError, type DecodedError } from './errors'
import { effectiveSpentToday } from './format'
import { filterLogs, refreshAiderLogs, useAiderLogs, type AiderLog } from './logs'

// ---------------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------------
export const RecipientMode = { ANY: 0, ALLOWLIST: 1 } as const
export type RecipientModeValue = (typeof RecipientMode)[keyof typeof RecipientMode]

export const RequestStatus = { PENDING: 0, APPROVED: 1, REJECTED: 2, EXPIRED: 3 } as const
export type RequestStatusValue = (typeof RequestStatus)[keyof typeof RequestStatus]

export interface WalletInfo {
  id: bigint
  owner: Address
  balance: bigint
  reserved: bigint
  /** balance − reserved */
  available: bigint
  paused: boolean
  /** 0 = anyone, 1 = allowlist only */
  mode: number
}

export type AgentStatus = 'active' | 'revoked' | 'expired'

export interface AgentInfo {
  walletId: bigint
  address: Address
  label: string
  perPaymentLimit: bigint
  dailyLimit: bigint
  /** unix seconds; 0 = never */
  expiresAt: bigint
  /** the contract's `active` flag (false after revoke) */
  active: boolean
  /** value returned by the contract (may be stale on v1) */
  spentToday: bigint
  /** spentToday corrected for a UTC day rollover (use this for display) */
  effectiveSpentToday: bigint
  /** dailyLimit − effectiveSpentToday, floored at 0 */
  remainingToday: bigint
  dayStart: bigint
  status: AgentStatus
  /** block of the first AgentAdded event for this agent on this wallet */
  addedAtBlock: bigint
}

export interface RequestInfo {
  id: bigint
  walletId: bigint
  agent: Address
  to: Address
  amount: bigint
  memo: string
  expiresAt: bigint
  status: number
  /** stored status is PENDING but the TTL passed: "expired, release funds" */
  isPastTtl: boolean
}

export interface RequestState {
  status: number
  /** owner can approve now */
  approvable: boolean
  /** anyone can release the reservation now (expireRequest) */
  releasable: boolean
  /** why it isn't approvable (client-side reason for UI copy) */
  reason?: 'past-ttl' | 'agent-revoked' | 'agent-expired' | 'not-pending'
}

export type AiderVersion = 'v1' | 'v2'

export interface GlobalStats {
  agentsConnected: number
  agentPayments: number
  /** Σ AgentPaid.amount + Σ approved request amounts (USDC smallest units) */
  usdcMoved: bigint
  approvalsHandled: number
}

// ---------------------------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------------------------
const CHAIN = AIDER_CHAIN_ID

const TRANSFER_ABI = parseAbi(['function transfer(address to, uint256 amount) returns (bool)'])
const keyBase = ['aider', CHAIN, AIDER_ADDRESS ?? 'none'] as const

/** Read many contract calls in multicall batches; failed calls come back undefined. */
async function readMany<T>(
  contracts: readonly { abi: typeof AIDER_ABI; address: Address; functionName: string; args?: readonly unknown[] }[],
  batch = 100,
): Promise<(T | undefined)[]> {
  const out: (T | undefined)[] = []
  for (let i = 0; i < contracts.length; i += batch) {
    const slice = contracts.slice(i, i + batch)
    const res = await readContracts(config, {
      contracts: slice.map((c) => ({ ...c, chainId: CHAIN })) as never,
      allowFailure: true,
    })
    for (const r of res as readonly { status: 'success' | 'failure'; result?: unknown }[]) {
      out.push(r.status === 'success' ? (r.result as T) : undefined)
    }
  }
  return out
}

type WalletTuple = readonly [Address, bigint, bigint, bigint, boolean, number]
type AgentTuple = readonly [string, bigint, bigint, bigint, boolean, bigint, bigint]
type RequestStruct = {
  walletId: bigint
  agent: Address
  to: Address
  amount: bigint
  memo: string
  expiresAt: bigint
  status: number
}

function toWallet(id: bigint, t: WalletTuple): WalletInfo {
  return { id, owner: t[0], balance: t[1], reserved: t[2], available: t[3], paused: t[4], mode: t[5] }
}

function sameAddr(a: string | undefined, b: string | undefined): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase()
}

// ---------------------------------------------------------------------------------------------
// Gates
// ---------------------------------------------------------------------------------------------
export type AiderGate = 'ready' | 'no-contract' | 'disconnected' | 'wrong-chain'

/** Network / contract / connection gate for the owner app. */
export function useAiderReady(): {
  gate: AiderGate
  ready: boolean
  address: Address | undefined
  isConnected: boolean
  isConnecting: boolean
  chainId: number | undefined
  onAiderChain: boolean
  chainName: string
} {
  const { address, isConnected, isConnecting, isReconnecting, chainId } = useAccount()
  const onAiderChain = chainId === CHAIN
  let gate: AiderGate = 'ready'
  if (!AIDER_ADDRESS) gate = 'no-contract'
  else if (!isConnected) gate = 'disconnected'
  else if (!onAiderChain) gate = 'wrong-chain'
  return {
    gate,
    ready: gate === 'ready',
    address,
    isConnected,
    isConnecting: isConnecting || isReconnecting,
    chainId,
    onAiderChain,
    chainName: AIDER_CHAIN_NAME,
  }
}

/** 'v2' when MAX_REQUEST_TTL() reads, 'v1' when it reverts (the deployed "Leash" build); undefined while loading. */
export function useAiderVersion(): AiderVersion | undefined {
  const q = useReadContract({
    abi: AIDER_ABI,
    address: AIDER_ADDRESS,
    functionName: 'MAX_REQUEST_TTL',
    chainId: CHAIN,
    query: { enabled: !!AIDER_ADDRESS, retry: 1, staleTime: Infinity, gcTime: Infinity },
  })
  if (q.isSuccess) return 'v2'
  if (q.isError) return 'v1'
  return undefined
}

// ---------------------------------------------------------------------------------------------
// Wallets
// ---------------------------------------------------------------------------------------------
/** Every Aider wallet owned by `owner` (scans ids 1..nextWalletId−1 in multicall batches of 100). */
export function useMyWallets(owner: Address | undefined) {
  const next = useReadContract({
    abi: AIDER_ABI,
    address: AIDER_ADDRESS,
    functionName: 'nextWalletId',
    chainId: CHAIN,
    query: { enabled: !!AIDER_ADDRESS, refetchInterval: 30_000 },
  })
  const nextId = next.data
  const q = useQuery({
    queryKey: [...keyBase, 'myWallets', owner?.toLowerCase() ?? '', nextId?.toString() ?? ''],
    enabled: !!AIDER_ADDRESS && !!owner && nextId !== undefined,
    queryFn: async () => {
      const ids: bigint[] = []
      for (let i = 1n; i < (nextId ?? 1n); i++) ids.push(i)
      const rows = await readMany<WalletTuple>(
        ids.map((id) => ({ abi: AIDER_ABI, address: AIDER_ADDRESS as Address, functionName: 'getWallet', args: [id] })),
      )
      return rows
        .map((t, i) => (t ? toWallet(ids[i], t) : undefined))
        .filter((w): w is WalletInfo => !!w && sameAddr(w.owner, owner))
    },
  })
  return {
    wallets: q.data ?? [],
    isLoading: next.isLoading || q.isLoading,
    error: next.error ?? q.error,
    refetch: q.refetch,
  }
}

/** One wallet's state (refreshes every 10 s). `undefined` id → disabled. */
export function useWallet(id: bigint | undefined) {
  const q = useReadContract({
    abi: AIDER_ABI,
    address: AIDER_ADDRESS,
    functionName: 'getWallet',
    args: id !== undefined ? [id] : undefined,
    chainId: CHAIN,
    query: { enabled: !!AIDER_ADDRESS && id !== undefined, refetchInterval: 10_000 },
  })
  const wallet = useMemo(() => (q.data && id !== undefined ? toWallet(id, q.data) : undefined), [q.data, id])
  return { wallet, isLoading: q.isLoading, error: q.error, refetch: q.refetch }
}

// ---------------------------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------------------------
function agentStatus(active: boolean, expiresAt: bigint, now: number): AgentStatus {
  if (!active) return 'revoked'
  if (expiresAt !== 0n && now > 0 && Number(expiresAt) <= now) return 'expired'
  return 'active'
}

/** Agents of a wallet: addresses from AgentAdded logs + getAgent multicall. */
export function useAgents(walletId: bigint | undefined) {
  const { logs, isLoading: logsLoading } = useAiderLogs()
  const now = useNow(30_000)
  const candidates = useMemo(() => {
    if (walletId === undefined) return [] as { address: Address; addedAtBlock: bigint }[]
    const firstSeen = new Map<string, { address: Address; addedAtBlock: bigint }>()
    for (const l of filterLogs(logs, 'AgentAdded')) {
      if (l.args.walletId !== walletId) continue
      const k = l.args.agent.toLowerCase()
      if (!firstSeen.has(k)) firstSeen.set(k, { address: l.args.agent, addedAtBlock: l.blockNumber })
    }
    return [...firstSeen.values()]
  }, [logs, walletId])

  const q = useQuery({
    queryKey: [...keyBase, 'agents', walletId?.toString() ?? '', candidates.map((c) => c.address.toLowerCase()).join(',')],
    enabled: !!AIDER_ADDRESS && walletId !== undefined && candidates.length > 0,
    refetchInterval: 15_000,
    queryFn: () =>
      readMany<AgentTuple>(
        candidates.map((c) => ({
          abi: AIDER_ABI,
          address: AIDER_ADDRESS as Address,
          functionName: 'getAgent',
          args: [walletId as bigint, c.address],
        })),
      ),
  })

  const agents = useMemo<AgentInfo[]>(() => {
    if (!q.data || walletId === undefined) return []
    const list: AgentInfo[] = []
    q.data.forEach((t, i) => {
      if (!t) return
      const c = candidates[i]
      if (!c) return
      const [label, perPaymentLimit, dailyLimit, expiresAt, active, spentToday, dayStart] = t
      const eff = now > 0 ? effectiveSpentToday({ spentToday, dayStart }, now) : spentToday
      list.push({
        walletId,
        address: c.address,
        label,
        perPaymentLimit,
        dailyLimit,
        expiresAt,
        active,
        spentToday,
        effectiveSpentToday: eff,
        remainingToday: dailyLimit > eff ? dailyLimit - eff : 0n,
        dayStart,
        status: agentStatus(active, expiresAt, now),
        addedAtBlock: c.addedAtBlock,
      })
    })
    return list
  }, [q.data, candidates, walletId, now])

  return {
    agents,
    isLoading: (logsLoading && candidates.length === 0) || q.isLoading,
    error: q.error,
    refetch: q.refetch,
  }
}

// ---------------------------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------------------------
/** Open (stored PENDING) requests of a wallet, refreshed every 6 s. Includes past-TTL ones (`isPastTtl`). */
export function usePendingRequests(walletId: bigint | undefined) {
  const now = useNow(5_000)
  const q = useQuery({
    queryKey: [...keyBase, 'pending', walletId?.toString() ?? ''],
    enabled: !!AIDER_ADDRESS && walletId !== undefined,
    refetchInterval: 6_000,
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: CHAIN })
      if (!client) throw new Error('No RPC client')
      const ids = await client.readContract({
        abi: AIDER_ABI,
        address: AIDER_ADDRESS as Address,
        functionName: 'getPendingRequests',
        args: [walletId as bigint],
      })
      const sorted = [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      const rows = await readMany<RequestStruct>(
        sorted.map((id) => ({ abi: AIDER_ABI, address: AIDER_ADDRESS as Address, functionName: 'getRequest', args: [id] })),
      )
      return rows
        .map((r, i) => (r ? { id: sorted[i], ...r } : undefined))
        .filter((r): r is RequestStruct & { id: bigint } => !!r && r.status === RequestStatus.PENDING)
    },
  })
  const requests = useMemo<RequestInfo[]>(
    () =>
      (q.data ?? []).map((r) => ({
        ...r,
        isPastTtl: now > 0 && Number(r.expiresAt) < now,
      })),
    [q.data, now],
  )
  return { requests, isLoading: q.isLoading, error: q.error, refetch: q.refetch }
}

/**
 * Approvable / releasable state per request id (key: id.toString()).
 * v2: the contract's getRequestState. v1: computed client-side, never marking requests from revoked
 * or expired agents approvable (pass `agents` from useAgents).
 */
export function useRequestStates(requests: readonly RequestInfo[], agents: readonly AgentInfo[]) {
  const version = useAiderVersion()
  const now = useNow(5_000)
  const ids = requests.map((r) => r.id)
  const q = useQuery({
    queryKey: [...keyBase, 'requestStates', ids.map(String).join(',')],
    enabled: !!AIDER_ADDRESS && version === 'v2' && ids.length > 0,
    refetchInterval: 6_000,
    queryFn: () =>
      readMany<readonly [number, boolean, boolean]>(
        ids.map((id) => ({ abi: AIDER_ABI, address: AIDER_ADDRESS as Address, functionName: 'getRequestState', args: [id] })),
      ),
  })

  const states = useMemo(() => {
    const map = new Map<string, RequestState>()
    const agentBy = new Map(agents.map((a) => [a.address.toLowerCase(), a]))
    requests.forEach((r, i) => {
      const pastTtl = now > 0 && Number(r.expiresAt) < now
      const agent = agentBy.get(r.agent.toLowerCase())
      let reason: RequestState['reason']
      if (r.status !== RequestStatus.PENDING) reason = 'not-pending'
      else if (agent?.status === 'revoked') reason = 'agent-revoked'
      else if (agent?.status === 'expired') reason = 'agent-expired'
      else if (pastTtl) reason = 'past-ttl'

      const onchain = version === 'v2' ? q.data?.[i] : undefined
      if (onchain) {
        map.set(r.id.toString(), { status: onchain[0], approvable: onchain[1], releasable: onchain[2], reason: onchain[1] ? undefined : reason })
        return
      }
      // v1 fallback (or v2 still loading): conservative
      const pending = r.status === RequestStatus.PENDING
      map.set(r.id.toString(), {
        status: r.status,
        approvable: pending && !pastTtl && !!agent && agent.status === 'active',
        releasable: pending && pastTtl,
        reason,
      })
    })
    return map
  }, [requests, agents, q.data, version, now])

  return { states, version, isLoading: q.isLoading }
}

// ---------------------------------------------------------------------------------------------
// Activity, lists, stats (from the indexer)
// ---------------------------------------------------------------------------------------------
/** Every event for this wallet, newest first, plus a requestId → PaymentRequested join map. */
export function useWalletActivity(walletId: bigint | undefined) {
  const { logs, isLoading, isSyncing, progress, error } = useAiderLogs()
  return useMemo(() => {
    const events: AiderLog[] = []
    const requestsById = new Map<string, Extract<AiderLog, { eventName: 'PaymentRequested' }>>()
    if (walletId !== undefined) {
      for (const l of logs) {
        if (!('walletId' in l.args) || l.args.walletId !== walletId) continue
        events.push(l)
        if (l.eventName === 'PaymentRequested') requestsById.set(l.args.requestId.toString(), l)
      }
      events.reverse()
    }
    return { events, requestsById, isLoading, isSyncing, progress, error }
  }, [logs, walletId, isLoading, isSyncing, progress, error])
}

/** Current allowlist / blocklist (candidates from events, verified with isAllowlisted/isBlocklisted). */
export function useAllowBlockLists(walletId: bigint | undefined) {
  const { logs } = useAiderLogs()
  const { allowCandidates, blockCandidates } = useMemo(() => {
    const a = new Map<string, Address>()
    const b = new Map<string, Address>()
    if (walletId !== undefined) {
      for (const l of filterLogs(logs, 'AllowlistUpdated')) if (l.args.walletId === walletId) a.set(l.args.recipient.toLowerCase(), l.args.recipient)
      for (const l of filterLogs(logs, 'BlocklistUpdated')) if (l.args.walletId === walletId) b.set(l.args.recipient.toLowerCase(), l.args.recipient)
    }
    return { allowCandidates: [...a.values()], blockCandidates: [...b.values()] }
  }, [logs, walletId])

  const q = useQuery({
    queryKey: [
      ...keyBase,
      'lists',
      walletId?.toString() ?? '',
      allowCandidates.join(',').toLowerCase(),
      blockCandidates.join(',').toLowerCase(),
    ],
    enabled: !!AIDER_ADDRESS && walletId !== undefined && allowCandidates.length + blockCandidates.length > 0,
    queryFn: async () => {
      const [allow, block] = await Promise.all([
        readMany<boolean>(
          allowCandidates.map((r) => ({ abi: AIDER_ABI, address: AIDER_ADDRESS as Address, functionName: 'isAllowlisted', args: [walletId as bigint, r] })),
        ),
        readMany<boolean>(
          blockCandidates.map((r) => ({ abi: AIDER_ABI, address: AIDER_ADDRESS as Address, functionName: 'isBlocklisted', args: [walletId as bigint, r] })),
        ),
      ])
      return {
        allowlist: allowCandidates.filter((_, i) => allow[i] === true),
        blocklist: blockCandidates.filter((_, i) => block[i] === true),
      }
    },
  })
  return {
    allowlist: q.data?.allowlist ?? [],
    blocklist: q.data?.blocklist ?? [],
    isLoading: q.isLoading,
    error: q.error,
    refetch: q.refetch,
  }
}

/** Contract-wide stats for the landing page, derived from the indexer. */
export function useGlobalStats() {
  const { logs, isLoading, isSyncing, progress, error } = useAiderLogs()
  const stats = useMemo<GlobalStats>(() => {
    const agents = new Set<string>()
    const requestAmounts = new Map<string, bigint>()
    let agentPayments = 0
    let usdcMoved = 0n
    const approved: string[] = []
    let approvalsHandled = 0
    for (const l of logs) {
      switch (l.eventName) {
        case 'AgentAdded':
          agents.add(`${l.args.walletId.toString()}:${l.args.agent.toLowerCase()}`)
          break
        case 'AgentPaid':
          agentPayments++
          usdcMoved += l.args.amount
          break
        case 'PaymentRequested':
          requestAmounts.set(l.args.requestId.toString(), l.args.amount)
          break
        case 'RequestApproved':
          approvalsHandled++
          approved.push(l.args.requestId.toString())
          break
        case 'RequestRejected':
          approvalsHandled++
          break
        default:
          break
      }
    }
    for (const id of approved) usdcMoved += requestAmounts.get(id) ?? 0n
    return { agentsConnected: agents.size, agentPayments, usdcMoved, approvalsHandled }
  }, [logs])
  return { stats, isLoading, isSyncing, progress, error, hasContract: !!AIDER_ADDRESS }
}

/** Block timestamp (unix seconds), cached forever. For lazily dating activity rows. */
export function useBlockTimestamp(blockNumber: bigint | undefined, enabled = true) {
  const q = useQuery({
    queryKey: ['aider', CHAIN, 'blockTs', blockNumber?.toString() ?? ''],
    enabled: enabled && blockNumber !== undefined,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: CHAIN })
      if (!client) throw new Error('No RPC client')
      const block = await client.getBlock({ blockNumber: blockNumber as bigint })
      return Number(block.timestamp)
    },
  })
  return q.data
}

// ---------------------------------------------------------------------------------------------
// USDC
// ---------------------------------------------------------------------------------------------
/** The owner's ERC-20 USDC balance and allowance to the Aider contract (refreshes every 10 s). */
export function useUsdc(owner: Address | undefined) {
  const q = useQuery({
    queryKey: [...keyBase, 'usdc', owner?.toLowerCase() ?? ''],
    enabled: !!owner,
    refetchInterval: 10_000,
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: CHAIN })
      if (!client) throw new Error('No RPC client')
      const [balance, allowance] = await Promise.all([
        client.readContract({ abi: ERC20_ABI, address: USDC_ADDRESS, functionName: 'balanceOf', args: [owner as Address] }),
        AIDER_ADDRESS
          ? client.readContract({ abi: ERC20_ABI, address: USDC_ADDRESS, functionName: 'allowance', args: [owner as Address, AIDER_ADDRESS] })
          : Promise.resolve(0n),
      ])
      return { balance, allowance }
    },
  })
  return {
    balance: q.data?.balance,
    allowance: q.data?.allowance,
    isLoading: q.isLoading,
    error: q.error,
    refetch: q.refetch,
  }
}

// ---------------------------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------------------------
export type AiderWriteFunction = ContractFunctionName<typeof AIDER_ABI, 'nonpayable' | 'payable'>
export type AiderWriteArgs<F extends AiderWriteFunction> = ContractFunctionArgs<typeof AIDER_ABI, 'nonpayable' | 'payable', F>

export interface WriteOptions {
  /** Toast text while confirming, e.g. "Revoking Claude Code…" */
  pending?: string
  /** Toast text on success, e.g. "Agent revoked" */
  success?: string
  /** Skip toasts entirely (caller shows its own UI). */
  silent?: boolean
}

export type WriteResult =
  | { ok: true; hash: Hash; receipt: TransactionReceipt; result: unknown }
  | { ok: false; error: DecodedError; hash?: Hash }

/**
 * Write helpers: simulate → wallet → wait for receipt (reverted receipt = failure) → toasts with an
 * explorer link → invalidate every query and refresh the indexer. Never throws; returns WriteResult.
 */
export function useAiderWrite() {
  const queryClient = useQueryClient()
  const { writeContractAsync } = useWriteContract()
  const { address } = useAccount()
  const [pendingCount, setPendingCount] = useState(0)

  const run = useCallback(
    async (
      request: { abi: typeof AIDER_ABI | typeof ERC20_ABI | typeof TRANSFER_ABI; address: Address; functionName: string; args: readonly unknown[] },
      opts: WriteOptions,
    ): Promise<WriteResult> => {
      const toastId = opts.silent ? undefined : toast.loading('Waiting for wallet…')
      setPendingCount((n) => n + 1)
      let hash: Hash | undefined
      try {
        // The request is built for either ABI, so viem can't narrow it; the cast is required by tsc.
        // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
        const sim = await simulateContract(config, { ...request, account: address, chainId: CHAIN } as never)
        const simulated = sim as unknown as { request: unknown; result: unknown }
        hash = await writeContractAsync(simulated.request as never)
        if (toastId !== undefined) toast.loading(opts.pending ?? 'Confirming…', { id: toastId, description: 'Waiting for Arc to confirm' })
        const receipt = await waitForTransactionReceipt(config, { hash, chainId: CHAIN })
        if (receipt.status === 'reverted') throw new TransactionRevertedError(hash)
        if (toastId !== undefined) {
          const url = explorerTx(hash)
          toast.success(opts.success ?? 'Done', {
            id: toastId,
            description: undefined,
            action: { label: 'View on explorer', onClick: () => window.open(url, '_blank', 'noopener,noreferrer') },
          })
        }
        await queryClient.invalidateQueries()
        void refreshAiderLogs()
        return { ok: true, hash, receipt, result: simulated.result }
      } catch (err) {
        const decoded = decodeAiderError(err)
        if (toastId !== undefined) {
          if (decoded.name === 'UserRejected') toast.message(decoded.title, { id: toastId, description: decoded.message })
          else toast.error(decoded.title, { id: toastId, description: decoded.message })
        }
        return { ok: false, error: decoded, hash }
      } finally {
        setPendingCount((n) => n - 1)
      }
    },
    [address, queryClient, writeContractAsync],
  )

  /** Call any state-changing Aider function. */
  const write = useCallback(
    <F extends AiderWriteFunction>(functionName: F, args: AiderWriteArgs<F>, opts: WriteOptions = {}): Promise<WriteResult> => {
      if (!AIDER_ADDRESS) {
        const error = decodeAiderError(new Error('NotDeployed'))
        if (!opts.silent) toast.error(error.title, { description: error.message })
        return Promise.resolve({ ok: false, error })
      }
      return run({ abi: AIDER_ABI, address: AIDER_ADDRESS, functionName, args: args as readonly unknown[] }, opts)
    },
    [run],
  )

  /** Approve the Aider contract to pull exactly `amount` USDC (step 1 of a deposit). */
  const approveUsdc = useCallback(
    (amount: bigint, opts: WriteOptions = {}): Promise<WriteResult> => {
      if (!AIDER_ADDRESS) {
        const error = decodeAiderError(new Error('NotDeployed'))
        return Promise.resolve({ ok: false, error })
      }
      return run(
        { abi: ERC20_ABI, address: USDC_ADDRESS, functionName: 'approve', args: [AIDER_ADDRESS, amount] },
        { pending: 'Approving USDC…', success: 'USDC approved', ...opts },
      )
    },
    [run],
  )

  /** Send USDC from the connected wallet (e.g. a little gas for a new agent: on Arc, gas is paid in USDC). */
  const sendUsdc = useCallback(
    (to: Address, amount: bigint, opts: WriteOptions = {}): Promise<WriteResult> =>
      run({ abi: TRANSFER_ABI, address: USDC_ADDRESS, functionName: 'transfer', args: [to, amount] }, { pending: 'Sending USDC…', success: 'USDC sent', ...opts }),
    [run],
  )

  return { write, approveUsdc, sendUsdc, isPending: pendingCount > 0 }
}
