'use client'

import { useMemo, useState } from 'react'
import { useReadContracts } from 'wagmi'
import { Plus, Terminal } from 'lucide-react'
import {
  Address,
  AddressInput,
  AmountInput,
  Button,
  Card,
  CodeBlock,
  ConfirmDialog,
  Dialog,
  Field,
  Input,
  Segmented,
  Skeleton,
  StatusPill,
  parseAddressInput,
  parseUsdInput,
} from '@/components/ui'
import { AIDER_ABI } from '@/aider/abi'
import { AIDER_ADDRESS, AIDER_CHAIN_ID, IS_DEFAULT_DEPLOYMENT, IS_TESTNET } from '@/aider/config'
import { useAgents, useAiderVersion, useAiderWrite, type AgentInfo } from '@/aider/hooks'
import { fmtExpiry, fmtUsd, nowSec, usdInputValue } from '@/aider/format'
import { useSelectedWallet } from './AppShell'

const EXPIRY_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'never', label: 'Never' },
]

function expiryFrom(choice: string): bigint {
  if (choice === 'never') return 0n
  return BigInt(nowSec() + Number(choice) * 86_400)
}

export function AgentsPage() {
  const { walletId } = useSelectedWallet()
  const { agents, isLoading } = useAgents(walletId)
  const version = useAiderVersion()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<AgentInfo | null>(null)
  const [revoking, setRevoking] = useState<AgentInfo | null>(null)
  const [connecting, setConnecting] = useState<AgentInfo | null>(null)
  const { write, isPending } = useAiderWrite()

  const openCounts = useReadContracts({
    allowFailure: true,
    query: { enabled: version === 'v2' && agents.length > 0, refetchInterval: 8_000 },
    contracts: agents.map((a) => ({
      abi: AIDER_ABI,
      address: AIDER_ADDRESS as `0x${string}`,
      chainId: AIDER_CHAIN_ID,
      functionName: 'openRequestCount' as const,
      args: [walletId, a.address] as const,
    })),
  })

  const sorted = useMemo(() => [...agents].sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1)), [agents])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Wallet #{walletId.toString()}</p>
          <h1 className="mt-2 text-[clamp(1.75rem,3vw,2.25rem)] font-light tracking-[-0.03em] text-fg">Agents</h1>
          <p className="mt-2 max-w-xl text-[15px] text-fg-2">Each agent has its own key and limits. Payments within the limits go through on their own; bigger ones wait for you.</p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
          Add agent
        </Button>
      </div>

      {isLoading && agents.length === 0 ? (
        <Card className="space-y-3 p-6">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
        </Card>
      ) : agents.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-lg text-fg">No agents yet</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-fg-2">Add an agent’s address and choose how much it can spend. You’ll get the commands to connect it.</p>
          <Button className="mt-6" onClick={() => setAdding(true)}>
            Add your first agent
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => {
            const idx = agents.indexOf(a)
            const open = openCounts.data?.[idx]?.status === 'success' ? (openCounts.data[idx].result) : undefined
            const pct = a.dailyLimit > 0n ? Number((a.effectiveSpentToday * 100n) / a.dailyLimit) : 0
            return (
              <Card key={a.address} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-sm text-fg">{(a.label || '??').slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="text-lg text-fg">{a.label || 'Unnamed agent'}</p>
                      <StatusPill tone={a.status === 'active' ? 'ok' : a.status === 'expired' ? 'warn' : 'danger'}>
                        {a.status === 'active' ? 'Active' : a.status === 'expired' ? 'Expired' : 'Revoked'}
                      </StatusPill>
                    </div>
                    <Address address={a.address} className="mt-1 text-[13px]" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" icon={<Terminal className="size-3.5" />} onClick={() => setConnecting(a)}>
                      Connect this agent
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(a)}>
                      Edit limits
                    </Button>
                    {a.active ? (
                      <Button size="sm" variant="danger-ghost" onClick={() => setRevoking(a)}>
                        Revoke
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={isPending}
                        onClick={() =>
                          void write('addAgent', [walletId, a.address, a.label, a.perPaymentLimit, a.dailyLimit, a.expiresAt !== 0n && Number(a.expiresAt) <= nowSec() ? expiryFrom('30') : a.expiresAt], {
                            pending: 'Re-enabling…',
                            success: `${a.label || 'Agent'} re-enabled`,
                          })
                        }
                      >
                        Re-enable
                      </Button>
                    )}
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
                  <div>
                    <dt className="label">Per payment</dt>
                    <dd className="mono-num mt-1.5 text-fg">{fmtUsd(a.perPaymentLimit)}</dd>
                  </div>
                  <div>
                    <dt className="label">Per day</dt>
                    <dd className="mono-num mt-1.5 text-fg">{fmtUsd(a.dailyLimit)}</dd>
                  </div>
                  <div>
                    <dt className="label">Expires</dt>
                    <dd className="mt-1.5 text-fg">{fmtExpiry(a.expiresAt)}</dd>
                  </div>
                  <div>
                    <dt className="label">Open requests</dt>
                    <dd className="mono-num mt-1.5 text-fg">{open !== undefined ? `${open.toString()} of 10` : '—'}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-fg-3">Spent today</span>
                    <span className="mono-num text-fg-2">
                      {fmtUsd(a.effectiveSpentToday)} of {fmtUsd(a.dailyLimit)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <AgentDialog open={adding} onClose={() => setAdding(false)} />
      {editing && <AgentDialog open agent={editing} onClose={() => setEditing(null)} />}
      {connecting && <ConnectDialog agent={connecting} onClose={() => setConnecting(null)} />}
      <ConfirmDialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        busy={isPending}
        tone="danger"
        title={`Revoke ${revoking?.label || 'this agent'}?`}
        message={
          version === 'v1'
            ? 'It can’t pay or make requests from the next block. Its open requests stay in your inbox; reject them there.'
            : 'It can’t pay or make requests from the next block. Its open requests are voided and their money can be released from Approvals.'
        }
        confirmLabel="Revoke agent"
        onConfirm={() => void (async () => {
          if (!revoking) return
          const r = await write('revokeAgent', [walletId, revoking.address], { pending: 'Revoking…', success: `${revoking.label || 'Agent'} revoked` })
          if (r.ok) setRevoking(null)
        })()}
      />
    </div>
  )
}

function AgentDialog({ open, onClose, agent }: { open: boolean; onClose: () => void; agent?: AgentInfo }) {
  const { walletId, owner } = useSelectedWallet()
  const { write, isPending } = useAiderWrite()
  const editing = !!agent
  const [addr, setAddr] = useState(agent?.address ?? '')
  const [label, setLabel] = useState(agent?.label ?? '')
  const [per, setPer] = useState(agent ? usdInputValue(agent.perPaymentLimit) : '0.10')
  const [daily, setDaily] = useState(agent ? usdInputValue(agent.dailyLimit) : '0.50')
  const [expiry, setExpiry] = useState(agent && agent.expiresAt === 0n ? 'never' : '30')

  const a = parseAddressInput(addr)
  const addrError = a.error ?? (a.address && a.address.toLowerCase() === owner.toLowerCase() ? 'This is your own address. Use a separate key for the agent.' : undefined)
  const p = parseUsdInput(per, { allowZero: true })
  const d = parseUsdInput(daily, { allowZero: true })
  const ok = !!a.address && !addrError && p.raw !== undefined && !p.error && d.raw !== undefined && !d.error

  const submit = async () => {
    if (!ok || !a.address || p.raw === undefined || d.raw === undefined) return
    const res = editing
      ? await write('updateAgent', [walletId, a.address, p.raw, d.raw, expiryFrom(expiry)], { pending: 'Saving limits…', success: 'Limits updated' })
      : await write('addAgent', [walletId, a.address, label.trim(), p.raw, d.raw, expiryFrom(expiry)], { pending: 'Adding agent…', success: `${label.trim() || 'Agent'} added` })
    if (res.ok) onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!isPending}
      title={editing ? `Edit ${agent?.label || 'agent'}` : 'Add an agent'}
      description={editing ? 'New limits apply to the next payment. Today’s spending is kept.' : 'Give a key its own allowance. Never use your own wallet key.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={isPending} disabled={!ok}>
            {editing ? 'Save limits' : 'Add agent'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field id="agent-addr" label="Agent address" error={addr ? addrError : undefined} hint="The address of the key the agent will use.">
          <AddressInput value={addr} onChange={setAddr} disabled={editing} />
        </Field>
        {!editing && (
          <Field id="agent-label" label="Label" hint="A name you’ll recognise, like “Claude Code”.">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={48} placeholder="Claude Code" />
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="agent-per" label="Per payment" error={p.error} hint="Largest single payment on its own.">
            <AmountInput value={per} onChange={setPer} />
          </Field>
          <Field id="agent-daily" label="Per day" error={d.error} hint="Resets at 00:00 UTC.">
            <AmountInput value={daily} onChange={setDaily} />
          </Field>
        </div>
        <div>
          <p className="mb-2 text-sm text-fg">Key expires</p>
          <Segmented label="Key expires" size="sm" value={expiry} onChange={setExpiry} options={EXPIRY_OPTIONS} />
          <p className="mt-2 text-[13px] text-fg-3">
            {expiry === 'never' ? 'The key works until you revoke it.' : `The key stops working ${expiry} days from now. You can extend it later.`}
          </p>
        </div>
      </div>
    </Dialog>
  )
}

function ConnectDialog({ agent, onClose }: { agent: AgentInfo; onClose: () => void }) {
  const { walletId } = useSelectedWallet()
  const network = IS_TESTNET ? '' : ' --network mainnet'
  const contract = IS_DEFAULT_DEPLOYMENT ? '' : ` --contract ${AIDER_ADDRESS}`
  const code = `# on the agent's machine, once
cd cli && bun install && bun run build && npm link

# the private key of ${agent.address}
export AIDR_AGENT_KEY=0x…
aidr init --wallet ${walletId.toString()}${network}${contract}

# check it worked
aidr balance`
  return (
    <Dialog open onClose={onClose} size="lg" title={`Connect ${agent.label || 'this agent'}`} description="Run these on the machine the agent runs on. The key stays there; it never comes back to this app.">
      <CodeBlock code={code} lang="bash" title="Terminal" />
      <p className="mt-4 text-[13px] leading-relaxed text-fg-3">
        The agent’s address also needs a little USDC of its own for gas. Coding agents should read{' '}
        <a href="/docs/skill-md" className="text-fg underline underline-offset-2">
          SKILL.md
        </a>{' '}
        before paying.
      </p>
    </Dialog>
  )
}
