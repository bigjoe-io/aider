'use client'

import { useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Pause, Play } from 'lucide-react'
import { AmountInput, Button, Card, ConfirmDialog, Dialog, Field, Skeleton, StatusPill, parseUsdInput } from '@/components/ui'
import { useAgents, useAiderWrite, usePendingRequests, useUsdc } from '@/aider/hooks'
import { fmtUsd } from '@/aider/format'
import { useSelectedWallet } from './AppShell'
import { ActivityList } from './Activity'

export function Overview() {
  const { walletId, wallet, owner } = useSelectedWallet()
  const { agents } = useAgents(walletId)
  const { requests } = usePendingRequests(walletId)
  const { write, isPending } = useAiderWrite()
  const [dialog, setDialog] = useState<'deposit' | 'withdraw' | 'pause' | null>(null)

  const active = agents.filter((a) => a.status === 'active')
  const spent = active.reduce((s, a) => s + a.effectiveSpentToday, 0n)
  const limit = active.reduce((s, a) => s + a.dailyLimit, 0n)
  const waiting = requests.filter((r) => !r.isPastTtl).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Wallet #{walletId.toString()}</p>
          <h1 className="mt-2 text-[clamp(1.75rem,3vw,2.25rem)] font-light tracking-[-0.03em] text-fg">Overview</h1>
        </div>
        {wallet && (wallet.paused ? <StatusPill tone="warn">Paused: agents can’t pay</StatusPill> : <StatusPill tone="ok">Active</StatusPill>)}
      </div>

      <Card className="glow-hero p-6 sm:p-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            ['Available', wallet?.available, 'What agents can spend and you can withdraw'],
            ['Reserved', wallet?.reserved, 'Set aside for open approval requests'],
            ['Balance', wallet?.balance, 'Everything in this wallet'],
          ].map(([label, v, hint]) => (
            <div key={label as string}>
              <p className="label">{label as string}</p>
              <p className="mono-num mt-2 text-3xl font-light tracking-tight text-fg sm:text-4xl">
                {v === undefined ? <Skeleton className="h-9 w-28" /> : fmtUsd(v as bigint)}
              </p>
              <p className="mt-1.5 text-[13px] text-fg-3">{hint as string}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
          <Button icon={<ArrowDownToLine className="size-4" />} onClick={() => setDialog('deposit')}>
            Deposit
          </Button>
          <Button variant="secondary" icon={<ArrowUpFromLine className="size-4" />} onClick={() => setDialog('withdraw')} disabled={!wallet || wallet.available === 0n}>
            Withdraw
          </Button>
          <Button
            variant={wallet?.paused ? 'secondary' : 'danger-ghost'}
            icon={wallet?.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            className="sm:ml-auto"
            disabled={!wallet}
            onClick={() => setDialog('pause')}
          >
            {wallet?.paused ? 'Resume agents' : 'Pause all agents'}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <p className="label">Agent spending today</p>
          <p className="mono-num mt-3 text-2xl font-light text-fg">
            {fmtUsd(spent)} <span className="text-base text-fg-3">of {fmtUsd(limit)}</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent" style={{ width: `${limit > 0n ? Number((spent * 100n) / limit) : 0}%` }} />
          </div>
          <p className="mt-3 text-[13px] text-fg-3">
            {active.length} active agent{active.length === 1 ? '' : 's'} · limits reset at 00:00 UTC
          </p>
        </Card>
        <Card className="p-6">
          <p className="label">Waiting for you</p>
          <p className="mono-num mt-3 text-2xl font-light text-fg">{waiting}</p>
          <p className="mt-3 text-[13px] text-fg-3">{waiting === 0 ? 'No approval requests right now.' : 'Approval requests over an agent’s limits.'}</p>
          <Button href="/app/approvals" variant="link" className="mt-4 text-fg">
            Open approvals
          </Button>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <p className="label">Recent activity</p>
          <Button href="/app/activity" variant="link" size="sm" className="text-fg">
            All activity
          </Button>
        </div>
        <div className="mt-2">
          <ActivityList limit={5} compact />
        </div>
      </Card>

      <DepositDialog open={dialog === 'deposit'} onClose={() => setDialog(null)} walletId={walletId} owner={owner} />
      <WithdrawDialog open={dialog === 'withdraw'} onClose={() => setDialog(null)} walletId={walletId} available={wallet?.available ?? 0n} />
      <ConfirmDialog
        open={dialog === 'pause'}
        onClose={() => setDialog(null)}
        busy={isPending}
        tone={wallet?.paused ? 'default' : 'danger'}
        title={wallet?.paused ? 'Resume all agents?' : 'Pause all agents?'}
        message={
          wallet?.paused
            ? 'Agents can pay and make requests again, within their limits.'
            : 'Every agent of this wallet is stopped until you resume. You can still deposit, withdraw and decide on requests.'
        }
        confirmLabel={wallet?.paused ? 'Resume' : 'Pause all agents'}
        onConfirm={() => void (async () => {
          const res = await write('pauseWallet', [walletId, !wallet?.paused], { pending: wallet?.paused ? 'Resuming…' : 'Pausing…', success: wallet?.paused ? 'Agents resumed' : 'All agents paused' })
          if (res.ok) setDialog(null)
        })()}
      />
    </div>
  )
}

function DepositDialog({ open, onClose, walletId, owner }: { open: boolean; onClose: () => void; walletId: bigint; owner: `0x${string}` }) {
  const [value, setValue] = useState('')
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing'>('idle')
  const { balance, allowance } = useUsdc(owner)
  const { write, approveUsdc } = useAiderWrite()
  const parsed = parseUsdInput(value, { max: balance })
  const needsApprove = parsed.raw !== undefined && (allowance ?? 0n) < parsed.raw
  const busy = step !== 'idle'

  const submit = async () => {
    if (parsed.raw === undefined || parsed.error) return
    if (needsApprove) {
      setStep('approving')
      const a = await approveUsdc(parsed.raw)
      if (!a.ok) return setStep('idle')
    }
    setStep('depositing')
    const d = await write('deposit', [walletId, parsed.raw], { pending: 'Depositing…', success: `Deposited ${fmtUsd(parsed.raw)}` })
    setStep('idle')
    if (d.ok) {
      setValue('')
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!busy}
      title="Deposit USDC"
      description="Move USDC from your address into this Aider wallet."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={busy} disabled={parsed.raw === undefined || !!parsed.error}>
            {step === 'approving' ? 'Approving…' : step === 'depositing' ? 'Depositing…' : needsApprove ? 'Approve and deposit' : 'Deposit'}
          </Button>
        </>
      }
    >
      <Field id="deposit-amount" label="Amount" aside={balance !== undefined ? `Your USDC: ${fmtUsd(balance)}` : undefined} error={parsed.error}>
        <AmountInput value={value} onChange={setValue} max={balance} onMax={() => balance !== undefined && setValue(fmtUsd(balance, { symbol: false, grouping: false }))} />
      </Field>
      {needsApprove && (
        <ol className="mt-5 space-y-2 text-[13px] text-fg-2">
          <li className={step === 'approving' ? 'text-fg' : ''}>1. Approve: let the Aider contract move exactly this amount of USDC.</li>
          <li className={step === 'depositing' ? 'text-fg' : ''}>2. Deposit: move it into wallet #{walletId.toString()}.</li>
        </ol>
      )}
    </Dialog>
  )
}

function WithdrawDialog({ open, onClose, walletId, available }: { open: boolean; onClose: () => void; walletId: bigint; available: bigint }) {
  const [value, setValue] = useState('')
  const { write, isPending } = useAiderWrite()
  const parsed = parseUsdInput(value, { max: available })
  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!isPending}
      title="Withdraw USDC"
      description="Send available USDC back to your address. Reserved money stays until its request is decided."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            loading={isPending}
            disabled={parsed.raw === undefined || !!parsed.error}
            onClick={() => void (async () => {
              if (parsed.raw === undefined) return
              const r = await write('withdraw', [walletId, parsed.raw], { pending: 'Withdrawing…', success: `Withdrew ${fmtUsd(parsed.raw)}` })
              if (r.ok) {
                setValue('')
                onClose()
              }
            })()}
          >
            Withdraw
          </Button>
        </>
      }
    >
      <Field id="withdraw-amount" label="Amount" aside={`Available: ${fmtUsd(available)}`} error={parsed.error}>
        <AmountInput value={value} onChange={setValue} max={available} onMax={() => setValue(fmtUsd(available, { symbol: false, grouping: false }))} />
      </Field>
    </Dialog>
  )
}
