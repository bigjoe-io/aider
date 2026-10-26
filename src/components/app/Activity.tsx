'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Card, Segmented, Skeleton } from '@/components/ui'
import { useAgents, useBlockTimestamp, useWalletActivity } from '@/aider/hooks'
import type { AiderLog } from '@/aider/logs'
import { explorerTx } from '@/aider/config'
import { fmtUsd, relativeTime, shortAddr } from '@/aider/format'
import { cn } from '@/lib/cn'
import { useSelectedWallet } from './AppShell'

type Kind = 'all' | 'payments' | 'requests' | 'money' | 'agents' | 'rules'

const KIND_OF: Record<string, Exclude<Kind, 'all'>> = {
  AgentPaid: 'payments',
  PaymentRequested: 'requests',
  RequestApproved: 'requests',
  RequestRejected: 'requests',
  RequestExpired: 'requests',
  Deposited: 'money',
  Withdrawn: 'money',
  WalletCreated: 'money',
  AgentAdded: 'agents',
  AgentUpdated: 'agents',
  AgentRevoked: 'agents',
  WalletPausedEvent: 'rules',
  RecipientModeSet: 'rules',
  AllowlistUpdated: 'rules',
  BlocklistUpdated: 'rules',
}

function useLabels() {
  const { walletId } = useSelectedWallet()
  const { agents } = useAgents(walletId)
  return useMemo(() => new Map(agents.map((a) => [a.address.toLowerCase(), a.label || shortAddr(a.address)])), [agents])
}

function describe(l: AiderLog, labels: Map<string, string>, requests: Map<string, Extract<AiderLog, { eventName: 'PaymentRequested' }>>) {
  const who = (a: string) => labels.get(a.toLowerCase()) ?? shortAddr(a)
  const a = l.args as Record<string, unknown>
  switch (l.eventName) {
    case 'AgentPaid':
      return { tone: 'ok', text: `${who(a.agent as string)} paid ${shortAddr(a.to as string)} ${fmtUsd(a.amount as bigint)}`, memo: a.memo as string }
    case 'PaymentRequested':
      return { tone: 'warn', text: `${who(a.agent as string)} asked to pay ${shortAddr(a.to as string)} ${fmtUsd(a.amount as bigint)}`, memo: a.memo as string }
    case 'RequestApproved':
    case 'RequestRejected':
    case 'RequestExpired': {
      const r = requests.get(String(a.requestId))
      const verb = l.eventName === 'RequestApproved' ? 'Approved' : l.eventName === 'RequestRejected' ? 'Rejected' : 'Released'
      return {
        tone: l.eventName === 'RequestApproved' ? 'ok' : 'neutral',
        text: r ? `${verb} request #${String(a.requestId)}: ${fmtUsd(r.args.amount)} to ${shortAddr(r.args.to)}` : `${verb} request #${String(a.requestId)}`,
        memo: r?.args.memo,
      }
    }
    case 'Deposited':
      return { tone: 'ok', text: `Deposited ${fmtUsd(a.amount as bigint)}` }
    case 'Withdrawn':
      return { tone: 'neutral', text: `Withdrew ${fmtUsd(a.amount as bigint)}` }
    case 'WalletCreated':
      return { tone: 'neutral', text: 'Wallet created' }
    case 'AgentAdded':
      return { tone: 'ok', text: `Added agent ${String(a.label) || shortAddr(a.agent as string)} (${shortAddr(a.agent as string)})` }
    case 'AgentUpdated':
      return { tone: 'neutral', text: `Changed ${who(a.agent as string)}’s limits` }
    case 'AgentRevoked':
      return { tone: 'danger', text: `Revoked ${who(a.agent as string)}` }
    case 'WalletPausedEvent':
      return { tone: a.paused ? 'warn' : 'ok', text: a.paused ? 'Paused all agents' : 'Resumed agents' }
    case 'RecipientModeSet':
      return { tone: 'neutral', text: Number(a.mode) === 1 ? 'Agents can only pay allowlisted addresses' : 'Agents can pay anyone' }
    case 'AllowlistUpdated':
      return { tone: 'neutral', text: `${a.allowed ? 'Allowlisted' : 'Removed from allowlist'} ${shortAddr(a.recipient as string)}` }
    case 'BlocklistUpdated':
      return { tone: a.blocked ? 'danger' : 'neutral', text: `${a.blocked ? 'Blocked' : 'Unblocked'} ${shortAddr(a.recipient as string)}` }
    default:
      return { tone: 'neutral', text: (l as AiderLog).eventName }
  }
}

function When({ block }: { block: bigint }) {
  const ts = useBlockTimestamp(block)
  return <span>{ts ? relativeTime(ts) : `block ${block.toString()}`}</span>
}

export function ActivityList({ limit, compact, kind = 'all', agent }: { limit?: number; compact?: boolean; kind?: Kind; agent?: string }) {
  const { walletId } = useSelectedWallet()
  const { events, requestsById, isLoading, progress } = useWalletActivity(walletId)
  const labels = useLabels()
  const rows = events
    .filter((e) => kind === 'all' || KIND_OF[e.eventName] === kind)
    .filter((e) => !agent || ('agent' in e.args && String(e.args.agent).toLowerCase() === agent))
    .slice(0, limit ?? 500)

  if (isLoading && events.length === 0)
    return (
      <div className="space-y-3 py-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <p className="text-[13px] text-fg-3">Reading activity from Arc… {Math.round(progress * 100)}%</p>
      </div>
    )
  if (rows.length === 0) return <p className="py-6 text-[15px] text-fg-3">Nothing here yet.</p>

  return (
    <ul className="divide-y divide-line">
      {rows.map((l) => {
        const d = describe(l, labels, requestsById)
        return (
          <li key={`${l.transactionHash}-${l.logIndex}`} className={cn('flex items-start gap-3', compact ? 'py-3' : 'py-4')}>
            <span
              className={cn(
                'mt-2 size-1.5 shrink-0 rounded-full',
                d.tone === 'ok' ? 'bg-accent' : d.tone === 'warn' ? 'bg-warn' : d.tone === 'danger' ? 'bg-danger' : 'bg-fg-3',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-fg">{d.text}</p>
              {d.memo && <p className="mt-0.5 truncate text-[13px] text-fg-2">“{d.memo}”</p>}
            </div>
            <div className="shrink-0 text-right text-[13px] text-fg-3">
              <When block={l.blockNumber} />
              <a href={explorerTx(l.transactionHash)} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex items-center justify-end gap-1 hover:text-fg">
                Explorer <ArrowUpRight className="size-3" />
              </a>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function ActivityPage() {
  const { walletId } = useSelectedWallet()
  const { agents } = useAgents(walletId)
  const [kind, setKind] = useState<Kind>('all')
  const [agent, setAgent] = useState('')
  return (
    <div className="space-y-6">
      <div>
        <p className="label">Wallet #{walletId.toString()}</p>
        <h1 className="mt-2 text-[clamp(1.75rem,3vw,2.25rem)] font-light tracking-[-0.03em] text-fg">Activity</h1>
        <p className="mt-2 text-[15px] text-fg-2">Every payment, request and change on this wallet, newest first. Each one links to the explorer.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-full overflow-x-auto">
          <Segmented
            label="Filter by type"
            size="sm"
            value={kind}
            onChange={(v) => setKind(v)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'payments', label: 'Payments' },
              { value: 'requests', label: 'Requests' },
              { value: 'money', label: 'Deposits' },
              { value: 'agents', label: 'Agents' },
              { value: 'rules', label: 'Rules' },
            ]}
          />
        </div>
        {agents.length > 0 && (
          <select
            aria-label="Filter by agent"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="h-8 rounded-full border border-line bg-surface px-3 text-[13px] text-fg"
          >
            <option value="">All agents</option>
            {agents.map((a) => (
              <option key={a.address} value={a.address.toLowerCase()}>
                {a.label || shortAddr(a.address)}
              </option>
            ))}
          </select>
        )}
      </div>
      <Card className="px-6 py-2">
        <ActivityList kind={kind} agent={agent || undefined} />
      </Card>
    </div>
  )
}
