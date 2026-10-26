'use client'

import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { X } from 'lucide-react'
import { Address, AddressInput, Button, Card, Field, Segmented, StatusPill, parseAddressInput } from '@/components/ui'
import { AIDER_ABI } from '@/aider/abi'
import { AIDER_ADDRESS, AIDER_CHAIN_ID } from '@/aider/config'
import { useAiderWrite, useAllowBlockLists } from '@/aider/hooks'
import { useSelectedWallet } from './AppShell'

export function RulesPage() {
  const { walletId, wallet } = useSelectedWallet()
  const { allowlist, blocklist } = useAllowBlockLists(walletId)
  const { write, isPending } = useAiderWrite()
  const mode = wallet?.mode === 1 ? 'allowlist' : 'any'

  return (
    <div className="space-y-6">
      <div>
        <p className="label">Wallet #{walletId.toString()}</p>
        <h1 className="mt-2 text-[clamp(1.75rem,3vw,2.25rem)] font-light tracking-[-0.03em] text-fg">Rules</h1>
        <p className="mt-2 max-w-xl text-[15px] text-fg-2">Decide who your agents can pay. These rules apply to every agent of this wallet, to new requests, and again when you approve one.</p>
      </div>

      <Card className="p-6">
        <p className="text-lg text-fg">Who agents can pay</p>
        <div className="mt-4">
          <Segmented
            label="Recipient mode"
            value={mode}
            onChange={(v) => {
              if (v === mode) return
              void write('setRecipientMode', [walletId, v === 'allowlist' ? 1 : 0], { pending: 'Saving…', success: v === 'allowlist' ? 'Allowlist only' : 'Agents can pay anyone' })
            }}
            options={[
              { value: 'any', label: 'Anyone' },
              { value: 'allowlist', label: 'Allowlist only' },
            ]}
          />
        </div>
        <p className="mt-3 text-[13px] text-fg-3">
          {mode === 'any' ? 'Agents can pay any address except blocked ones.' : 'Agents can only pay addresses on the allowlist below. Blocked addresses always lose.'}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListEditor
          title="Allowlist"
          hint={mode === 'any' ? 'Only used in “Allowlist only” mode.' : 'The only addresses agents can pay.'}
          items={allowlist}
          busy={isPending}
          onAdd={(a) => write('setAllowlist', [walletId, a, true], { pending: 'Adding…', success: 'Added to allowlist' })}
          onRemove={(a) => write('setAllowlist', [walletId, a, false], { pending: 'Removing…', success: 'Removed from allowlist' })}
        />
        <ListEditor
          title="Blocklist"
          hint="Agents can never pay these, in any mode."
          items={blocklist}
          busy={isPending}
          onAdd={(a) => write('setBlocklist', [walletId, a, true], { pending: 'Blocking…', success: 'Address blocked' })}
          onRemove={(a) => write('setBlocklist', [walletId, a, false], { pending: 'Unblocking…', success: 'Address unblocked' })}
        />
      </div>

      <CheckAddress walletId={walletId} />
    </div>
  )
}

function ListEditor({
  title,
  hint,
  items,
  busy,
  onAdd,
  onRemove,
}: {
  title: string
  hint: string
  items: `0x${string}`[]
  busy: boolean
  onAdd: (a: `0x${string}`) => Promise<unknown>
  onRemove: (a: `0x${string}`) => Promise<unknown>
}) {
  const [value, setValue] = useState('')
  const parsed = parseAddressInput(value)
  const id = `add-${title.toLowerCase()}`
  return (
    <Card className="p-6">
      <p className="text-lg text-fg">{title}</p>
      <p className="mt-1 text-[13px] text-fg-3">{hint}</p>
      <form
        className="mt-4 flex items-start gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!parsed.address) return
          void onAdd(parsed.address).then(() => setValue(''))
        }}
      >
        <Field id={id} label={`Add to ${title.toLowerCase()}`} error={value ? parsed.error : undefined} className="flex-1">
          <AddressInput value={value} onChange={setValue} />
        </Field>
        <Button type="submit" variant="secondary" className="mt-[26px]" disabled={!parsed.address || busy}>
          Add
        </Button>
      </form>
      {items.length === 0 ? (
        <p className="mt-5 text-[13px] text-fg-3">No addresses yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {items.map((a) => (
            <li key={a} className="flex items-center justify-between gap-3 py-2.5">
              <Address address={a} />
              <button type="button" aria-label={`Remove ${a}`} disabled={busy} onClick={() => void onRemove(a)} className="rounded-lg p-1.5 text-fg-3 hover:text-fg disabled:opacity-40">
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function CheckAddress({ walletId }: { walletId: bigint }) {
  const [value, setValue] = useState('')
  const parsed = parseAddressInput(value)
  const q = useReadContract({
    abi: AIDER_ABI,
    address: AIDER_ADDRESS,
    chainId: AIDER_CHAIN_ID,
    functionName: 'isRecipientPermitted',
    args: parsed.address ? [walletId, parsed.address] : undefined,
    query: { enabled: !!parsed.address && !!AIDER_ADDRESS },
  })
  return (
    <Card className="p-6">
      <p className="text-lg text-fg">Check an address</p>
      <p className="mt-1 text-[13px] text-fg-3">Can your agents pay it right now? (Recipient rules only; limits still apply.)</p>
      <div className="mt-4 flex flex-wrap items-start gap-3">
        <Field id="check-addr" label="Address" error={value ? parsed.error : undefined} className="min-w-[260px] flex-1">
          <AddressInput value={value} onChange={setValue} />
        </Field>
        {parsed.address && q.data !== undefined && (
          <StatusPill tone={q.data ? 'ok' : 'danger'} className="mt-[30px]">
            {q.data ? 'Can be paid' : 'Can’t be paid'}
          </StatusPill>
        )}
      </div>
    </Card>
  )
}
