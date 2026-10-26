'use client'

import { Clock } from 'lucide-react'
import { Button, Card, Skeleton, StatusPill } from '@/components/ui'
import { useAgents, useAiderVersion, useAiderWrite, usePendingRequests, useRequestStates, type RequestInfo, type RequestState } from '@/aider/hooks'
import { fmtUsd, shortAddr, timeLeft } from '@/aider/format'
import { useNow } from '@/lib/hooks'
import { useSelectedWallet } from './AppShell'

export function ApprovalsPage() {
  const { walletId } = useSelectedWallet()
  const { requests, isLoading } = usePendingRequests(walletId)
  const { agents } = useAgents(walletId)
  const { states } = useRequestStates(requests, agents)
  const version = useAiderVersion()
  const { write, isPending } = useAiderWrite()
  useNow(1_000)

  const labels = new Map(agents.map((a) => [a.address.toLowerCase(), a.label || shortAddr(a.address)]))
  const stateOf = (r: RequestInfo): RequestState | undefined => states.get(r.id.toString())
  const sorted = [...requests].sort((a, b) => Number(a.expiresAt - b.expiresAt))
  const waiting = sorted.filter((r) => !r.isPastTtl && stateOf(r)?.reason !== 'agent-revoked' && stateOf(r)?.reason !== 'agent-expired')
  const voided = sorted.filter((r) => !r.isPastTtl && (stateOf(r)?.reason === 'agent-revoked' || stateOf(r)?.reason === 'agent-expired'))
  const expired = sorted.filter((r) => r.isPastTtl)
  const releasable = [...voided, ...expired].filter((r) => stateOf(r)?.releasable ?? r.isPastTtl)

  const rejectAll = async (ids: bigint[]) => {
    if (version === 'v2') return write('rejectRequests', [ids], { pending: `Rejecting ${ids.length} requests…`, success: 'Requests rejected' })
    for (const id of ids) await write('rejectRequest', [id], { pending: `Rejecting #${id.toString()}…`, success: `Rejected #${id.toString()}` })
  }
  const releaseAll = async (ids: bigint[]) => {
    if (version === 'v2') return write('expireRequests', [ids], { pending: `Releasing ${ids.length} requests…`, success: 'Funds released' })
    for (const id of ids) await write('expireRequest', [id], { pending: `Releasing #${id.toString()}…`, success: `Released #${id.toString()}` })
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label">Wallet #{walletId.toString()}</p>
        <h1 className="mt-2 text-[clamp(1.75rem,3vw,2.25rem)] font-light tracking-[-0.03em] text-fg">Approvals</h1>
        <p className="mt-2 max-w-xl text-[15px] text-fg-2">Payments your agents asked for that are over their limits. The money is reserved until you decide. This page refreshes on its own.</p>
      </div>

      {isLoading && requests.length === 0 ? (
        <Card className="space-y-3 p-6">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </Card>
      ) : requests.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-lg text-fg">Nothing waiting for you</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-fg-2">When an agent needs more than its limits allow, the request appears here with the amount already set aside.</p>
        </Card>
      ) : null}

      {waiting.length > 0 && (
        <Group
          title="Waiting for you"
          count={waiting.length}
          action={
            waiting.length > 1 && (
              <Button size="sm" variant="secondary" loading={isPending} onClick={() => void rejectAll(waiting.map((r) => r.id))}>
                Reject all
              </Button>
            )
          }
        >
          {waiting.map((r) => (
            <RequestCard key={r.id.toString()} r={r} label={labels.get(r.agent.toLowerCase())}>
              <Button size="sm" variant="secondary" loading={isPending} onClick={() => void write('rejectRequest', [r.id], { pending: 'Rejecting…', success: `Rejected #${r.id.toString()}` })}>
                Reject
              </Button>
              <Button
                size="sm"
                loading={isPending}
                disabled={stateOf(r) ? !stateOf(r)?.approvable : false}
                onClick={() => void write('approveRequest', [r.id], { pending: 'Approving and paying…', success: `Paid ${fmtUsd(r.amount)}` })}
              >
                Approve
              </Button>
            </RequestCard>
          ))}
        </Group>
      )}

      {voided.length > 0 && (
        <Group
          title="Agent revoked or expired"
          note={version === 'v1' ? 'These came from agents you revoked or that expired. Reject them to free the money.' : 'These can’t be approved any more. Release them to free the money.'}
          count={voided.length}
          action={
            version === 'v2' &&
            voided.length > 1 && (
              <Button size="sm" variant="secondary" loading={isPending} onClick={() => void releaseAll(voided.map((r) => r.id))}>
                Release all
              </Button>
            )
          }
        >
          {voided.map((r) => (
            <RequestCard key={r.id.toString()} r={r} label={labels.get(r.agent.toLowerCase())} tone="danger" status={stateOf(r)?.reason === 'agent-expired' ? 'Agent expired' : 'Agent revoked'}>
              <Button size="sm" variant="secondary" loading={isPending} onClick={() => void write('rejectRequest', [r.id], { pending: 'Rejecting…', success: `Rejected #${r.id.toString()}` })}>
                Reject
              </Button>
              {version === 'v2' && (
                <Button size="sm" loading={isPending} onClick={() => void write('expireRequest', [r.id], { pending: 'Releasing…', success: 'Funds released' })}>
                  Release
                </Button>
              )}
            </RequestCard>
          ))}
        </Group>
      )}

      {expired.length > 0 && (
        <Group
          title="Expired: release the funds"
          note="Their time to approve ran out. Releasing gives the reserved money back to the wallet. Anyone can do this."
          count={expired.length}
          action={
            releasable.length > 1 && (
              <Button size="sm" variant="secondary" loading={isPending} onClick={() => void releaseAll(expired.map((r) => r.id))}>
                Release all
              </Button>
            )
          }
        >
          {expired.map((r) => (
            <RequestCard key={r.id.toString()} r={r} label={labels.get(r.agent.toLowerCase())} tone="neutral" status="Expired">
              <Button size="sm" loading={isPending} onClick={() => void write('expireRequest', [r.id], { pending: 'Releasing…', success: 'Funds released' })}>
                Release
              </Button>
            </RequestCard>
          ))}
        </Group>
      )}
    </div>
  )
}

function Group({ title, note, count, action, children }: { title: string; note?: string; count: number; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-lg font-normal text-fg">
          {title} <span className="mono-num rounded-full bg-surface-2 px-2 py-0.5 text-[13px] text-fg-2">{count}</span>
        </h2>
        {action}
      </div>
      {note && <p className="mt-1.5 text-[13px] text-fg-3">{note}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function RequestCard({ r, label, tone = 'warn', status, children }: { r: RequestInfo; label?: string; tone?: 'warn' | 'danger' | 'neutral'; status?: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-wrap items-center gap-5 p-5 sm:p-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="text-[17px] text-fg">{r.memo || 'No memo'}</p>
          <span className="text-[13px] text-fg-3">#{r.id.toString()}</span>
          {status && <StatusPill tone={tone}>{status}</StatusPill>}
        </div>
        <p className="mt-1.5 text-[13px] text-fg-2">
          {label ?? shortAddr(r.agent)} → <span className="mono-num">{shortAddr(r.to)}</span>
        </p>
        {!status && (
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-fg-3">
            <Clock className="size-3.5" /> {timeLeft(r.expiresAt)}
          </p>
        )}
      </div>
      <p className="mono-num text-2xl font-light text-fg">{fmtUsd(r.amount)}</p>
      <div className="flex gap-2">{children}</div>
    </Card>
  )
}
