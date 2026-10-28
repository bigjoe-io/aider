'use client'

import { useState } from 'react'
import { Check, Clock, ShieldOff } from 'lucide-react'
import { Button, CodeBlock, Device, Segmented, Skeleton, Toggle } from '@/components/ui'
import { explorerAddress, type NetworkConfig } from '@/aider/config'
import { PerNetwork } from '@/components/site/NetworkVariants'
import { useGlobalStats } from '@/aider/hooks'
import { useAiderLogs } from '@/aider/logs'

function useStats() {
  const s = useGlobalStats()
  const { logs } = useAiderLogs()
  return { ...s, logsCount: logs.length }
}
import { fmtUsd, shortAddr } from '@/aider/format'
import { cn } from '@/lib/cn'

/** Small pill in the hero: which network and contract the app is wired to. */
export function NetworkPill() {
  return <PerNetwork>{(net) => <NetworkPillFor net={net} />}</PerNetwork>
}

function NetworkPillFor({ net }: { net: NetworkConfig }) {
  if (!net.contract)
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-bg/40 px-3 py-1.5 text-[13px] text-fg-2 backdrop-blur">
        <span className="size-1.5 rounded-full bg-warn" /> Not deployed on {net.displayName} yet
      </span>
    )
  return (
    <a
      href={explorerAddress(net.contract, net.chainId)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-line bg-bg/40 px-3 py-1.5 text-[13px] text-fg-2 backdrop-blur transition-colors hover:text-fg"
    >
      <span className={cn('size-1.5 rounded-full', net.isTestnet ? 'bg-warn' : 'bg-accent')} />
      {net.displayName} · contract <span className="mono-num">{shortAddr(net.contract)}</span>
    </a>
  )
}

export function LiveStats() {
  const { stats: raw, isLoading, error, logsCount } = useStats()
  const stats = isLoading && logsCount === 0 ? undefined : raw
  const failed = !!error && logsCount === 0
  const cells = [
    { label: 'Agents connected', value: stats ? String(stats.agentsConnected) : undefined },
    { label: 'Agent payments', value: stats ? String(stats.agentPayments) : undefined },
    { label: 'USDC moved by agents', value: stats ? fmtUsd(stats.usdcMoved) : undefined },
    { label: 'Approvals handled', value: stats ? String(stats.approvalsHandled) : undefined },
  ]
  return (
    <section aria-label="Live numbers" className="container-x">
      <div className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-line md:grid-cols-4">
        {cells.map((c, i) => (
          <div key={c.label} className={cn('px-6 py-6', i > 0 && 'md:border-l', i % 2 === 1 && 'border-l', i >= 2 && 'border-t md:border-t-0', 'border-line')}>
            <p className="label">{c.label}</p>
            <p className="mono-num mt-3 text-3xl font-light tracking-tight text-fg">
              {c.value ?? (failed ? '—' : <Skeleton className="h-8 w-20" />)}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-fg-3">
        {failed ? (
          'Couldn’t reach Arc right now.'
        ) : (
          <PerNetwork>
            {(net) => (net.contract ? `Live from ${net.displayName}, read straight from the contract’s events.` : 'The contract isn’t deployed on this network yet.')}
          </PerNetwork>
        )}
      </p>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// "What you control / what your agent sees" panel
// ---------------------------------------------------------------------------------------------

const plain = (v: bigint) => fmtUsd(v, { symbol: false, grouping: false })

const PER = [50_000n, 100_000n, 250_000n]
const DAILY = [500_000n, 1_000_000n, 5_000_000n]

function Chips({ values, value, onChange, label }: { values: bigint[]; value: bigint; onChange: (v: bigint) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="mt-2 flex gap-1.5">
      {values.map((v) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={v === value}
          onClick={() => onChange(v)}
          className={cn(
            'rounded-full px-3 py-1.5 text-[13px] transition-colors',
            v === value ? 'bg-fg text-bg' : 'bg-surface-2 text-fg-2 hover:text-fg',
          )}
        >
          {fmtUsd(v)}
        </button>
      ))}
    </div>
  )
}

export function LivePanelCards() {
  const [view, setView] = useState<'owner' | 'agent'>('owner')
  const [per, setPer] = useState(100_000n)
  const [daily, setDaily] = useState(500_000n)
  const [approved, setApproved] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [revoked, setRevoked] = useState(false)
  const spent = 200_000n < daily ? 200_000n : daily

  const balanceJson = `{
  "agent": {
    "label": "Claude Code",
    "status": "active",
    "perPaymentLimit": "${plain(per)}",
    "dailyLimit": "${plain(daily)}",
    "spentToday": "${plain(spent)}",
    "remainingToday": "${plain(daily - spent)}"
  },
  "maxDirectPayment": "${plain(per < daily - spent ? per : daily - spent)}"
}`
  const payJson =
    approved === 'pending'
      ? `{
  "status": "pending_approval",
  "requestId": "42",
  "reason": "OverPerPaymentLimit",
  "amount": "1.00",
  "ttlMinutes": 30
}`
      : `{
  "status": "${approved}",
  "requestId": "42",
  "amount": "1.00",
  "memo": "Premium dataset"
}`
  const revokeJson = revoked
    ? `{
  "status": "error",
  "error": "AgentRevokedError",
  "hint": "Stop and tell the user."
}`
    : `{
  "status": "paid",
  "amount": "0.05",
  "memo": "API credits"
}`

  return (
    <div>
      <div className="flex flex-col items-center gap-3">
        <Segmented
          label="Choose a view"
          value={view}
          onChange={(v) => setView(v)}
          options={[
            { value: 'owner', label: 'What you control' },
            { value: 'agent', label: 'What your agent sees' },
          ]}
        />
        <p className="text-[13px] text-fg-3">Try the controls. The buttons open the real app.</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* Limits */}
        <div>
          <Device className="h-[380px]" innerClassName="flex flex-col p-4">
            {view === 'owner' ? (
              <>
                <div className="rounded-2xl bg-surface-2/70 p-4">
                  <p className="text-[13px] text-fg-3">Per payment</p>
                  <Chips label="Per-payment limit" values={PER} value={per} onChange={setPer} />
                  <p className="mt-4 text-[13px] text-fg-3">Per day</p>
                  <Chips label="Daily limit" values={DAILY} value={daily} onChange={setDaily} />
                </div>
                <div className="mt-3 rounded-2xl bg-surface-2/70 p-4">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-fg-3">Spent today</span>
                    <span className="mono-num text-fg">
                      {fmtUsd(spent)} <span className="text-fg-3">of {fmtUsd(daily)}</span>
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Number((spent * 100n) / daily)}%` }} />
                  </div>
                </div>
                <Button href="/app/agents" size="md" className="mt-auto w-full">
                  Set limits
                </Button>
              </>
            ) : (
              <CodeBlock code={balanceJson} lang="json" title="aidr balance" copy={false} className="h-full" />
            )}
          </Device>
          <CardCaption title="Spending limits" slug="spending-rules" text="Per-payment and daily caps for every agent, checked onchain on every payment." />
        </div>

        {/* Approval */}
        <div>
          <Device className="h-[380px]" innerClassName="flex flex-col p-4">
            {view === 'owner' ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-fg-3">Waiting for you</span>
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-3">Preview</span>
                </div>
                <div className="mt-3 rounded-2xl bg-surface-2/70 p-4">
                  <p className="text-[15px] text-fg">Premium dataset</p>
                  <p className="mono-num mt-1 text-3xl font-light text-fg">$1.00</p>
                  <p className="mt-2 text-[13px] text-fg-3">
                    Claude Code → <span className="mono-num">0x8f3…a21</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] text-fg-3">
                    <Clock className="size-3.5" /> 28 min left · over the $0.10 limit
                  </p>
                </div>
                {approved === 'pending' ? (
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => setApproved('rejected')}>
                      Reject
                    </Button>
                    <Button onClick={() => setApproved('approved')}>Approve</Button>
                  </div>
                ) : (
                  <div className="mt-auto space-y-2">
                    <p className={cn('flex items-center justify-center gap-2 rounded-full py-2.5 text-sm', approved === 'approved' ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-fg-2')}>
                      {approved === 'approved' ? <Check className="size-4" /> : null}
                      {approved === 'approved' ? 'Approved · paid' : 'Rejected · funds released'}
                    </p>
                    <Button href="/app/approvals" variant="secondary" className="w-full">
                      Open approvals
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <CodeBlock code={payJson} lang="json" title="aidr pay … 1.00" copy={false} className="h-full" />
            )}
          </Device>
          <CardCaption title="Approvals" slug="approval-requests" text="Bigger payments wait for you, with the money reserved so nothing else can spend it." />
        </div>

        {/* Revoke */}
        <div>
          <Device className="h-[380px]" innerClassName="flex flex-col p-4">
            {view === 'owner' ? (
              <>
                <div className="rounded-2xl bg-surface-2/70 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-surface text-sm text-fg">CC</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] text-fg">Claude Code</p>
                      <p className="mono-num text-[13px] text-fg-3">0x7099…79C8</p>
                    </div>
                    <Toggle checked={!revoked} onChange={(on) => setRevoked(!on)} label={revoked ? 'Agent revoked' : 'Agent active'} />
                  </div>
                </div>
                <div className="mt-3 flex flex-1 flex-col items-center justify-center rounded-2xl bg-surface-2/70 p-4 text-center">
                  {revoked ? (
                    <>
                      <ShieldOff className="size-7 text-danger" />
                      <p className="mt-3 text-[15px] text-fg">Agent revoked</p>
                      <p className="mt-1 text-[13px] text-fg-3">Next payment: blocked onchain</p>
                    </>
                  ) : (
                    <>
                      <Check className="size-7 text-accent" />
                      <p className="mt-3 text-[15px] text-fg">Agent active</p>
                      <p className="mt-1 text-[13px] text-fg-3">Paying within its limits</p>
                    </>
                  )}
                </div>
                <Button href="/app/agents" className="mt-3 w-full">
                  Manage agents
                </Button>
              </>
            ) : (
              <CodeBlock code={revokeJson} lang="json" title="aidr pay … 0.05" copy={false} className="h-full" />
            )}
          </Device>
          <CardCaption title="Instant revoke" slug="revoking-and-pausing" text="Cut one agent off, or pause them all. It takes effect in the next block." />
        </div>
      </div>
    </div>
  )
}

function CardCaption({ title, text, slug }: { title: string; text: string; slug: string }) {
  return (
    <div className="mt-5 px-1">
      <Button href={`/docs/${slug}`} variant="link" size="md" className="text-fg">
        {title}
      </Button>
      <p className="mt-1.5 text-[15px] leading-relaxed text-fg-2">{text}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Developers code panel
// ---------------------------------------------------------------------------------------------

const DEV_TABS = {
  terminal: {
    title: 'Terminal',
    lang: 'bash',
    code: `# once, on the agent's machine
npm install -g aidr-cli
aidr setup --name "Claude Code"{{setupFlags}}
# the owner opens the link it prints and clicks Add agent

# inside any task
aidr balance
aidr pay 0x8f3…a21 0.05 "API credits"
aidr wait 42`,
  },
  skill: {
    title: 'SKILL.md',
    lang: 'markdown',
    code: `## Rules
1. Check \`aidr balance\` before paying.
2. Write honest memos. The owner reads every one.
3. Never split a payment to dodge a limit.
4. Report pending approvals. Not paid until approved.
5. Stop on WalletPaused or AgentRevokedError.
6. One payment at a time.
7. Never reveal the key.`,
  },
  contract: {
    title: 'Aider.sol',
    lang: 'solidity',
    code: `function agentPay(uint256 walletId, address to, uint256 amount, string calldata memo) external;

function requestPayment(uint256 walletId, address to, uint256 amount,
    string calldata memo, uint256 ttlSeconds) external returns (uint256 requestId);

function approveRequest(uint256 requestId) external;   // owner only
function revokeAgent(uint256 walletId, address agent) external;   // owner only`,
  },
} as const

/** `aidr setup` flags for a network (none on the default testnet deployment). */
function setupFlags(net: NetworkConfig): string {
  return (net.isTestnet ? '' : ' --network mainnet') + (net.isDefaultDeployment ? '' : ` --contract ${net.contract ?? '<contract>'}`)
}

export function DeveloperCode() {
  const [tab, setTab] = useState<keyof typeof DEV_TABS>('terminal')
  const t = DEV_TABS[tab]
  return (
    <div className="min-w-0">
      <PerNetwork>
        {(net) => <CodeBlock code={t.code.replace('{{setupFlags}}', setupFlags(net))} lang={t.lang} title={t.title} className="min-h-[300px]" />}
      </PerNetwork>
      <div role="tablist" aria-label="Code examples" className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {(Object.keys(DEV_TABS) as (keyof typeof DEV_TABS)[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn('transition-colors', tab === k ? 'text-fg' : 'text-fg-3 hover:text-fg')}
          >
            {k === 'terminal' ? 'Terminal' : k === 'skill' ? 'SKILL.md' : 'Contract'}
          </button>
        ))}
        <a href="/llms.txt" className="text-fg-3 hover:text-fg">
          llms.txt
        </a>
        <PerNetwork>
          {(net) =>
            net.contract && (
              <a href={explorerAddress(net.contract, net.chainId)} target="_blank" rel="noopener noreferrer" className="text-fg-3 hover:text-fg">
                Contract on explorer ↗
              </a>
            )
          }
        </PerNetwork>
      </div>
    </div>
  )
}
