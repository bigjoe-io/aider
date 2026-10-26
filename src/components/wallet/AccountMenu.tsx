'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useAccount, useDisconnect, useEnsName } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { ArrowUpRight, ChevronDown, LogOut } from 'lucide-react'
import { AIDER_CHAIN_ID, AIDER_CHAIN_NAME, IS_TESTNET, explorerAddress } from '@/aider/config'
import { shortAddr } from '@/aider/format'
import { CopyButton } from '@/components/ui/CopyButton'
import { StatusDot } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { SwitchNetworkButton } from './NetworkGuard'

/** Connected-account pill with a disclosure panel: address, copy, explorer, network, disconnect. */
export function AccountMenu({ className, compact }: { className?: string; compact?: boolean }) {
  const { address, chainId, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ens } = useEnsName({ address, chainId: mainnet.id, query: { enabled: !!address, staleTime: Infinity } })
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!address) return null
  const wrong = chainId !== AIDER_CHAIN_ID

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface pl-3 pr-2.5 text-sm text-fg transition-colors hover:bg-surface-2"
      >
        <StatusDot tone={wrong ? 'danger' : IS_TESTNET ? 'warn' : 'accent'} />
        <span className="font-mono text-[13px]">{ens ?? shortAddr(address)}</span>
        {!compact && <ChevronDown aria-hidden className={cn('size-4 text-fg-3 transition-transform', open && 'rotate-180')} />}
        <span className="sr-only">Account menu</span>
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] max-w-[calc(100vw-2rem)] animate-scale-in rounded-2xl border border-line-strong bg-surface p-2 shadow-[var(--shadow-pop)]"
        >
          <div className="rounded-xl bg-surface-2/60 p-3">
            <p className="label">Connected{connector ? ` · ${connector.name}` : ''}</p>
            <div className="mt-1.5 flex items-start gap-1">
              <p className="min-w-0 flex-1 break-all font-mono text-[12.5px] leading-relaxed text-fg">{address}</p>
              <CopyButton value={address} ariaLabel="Copy address" size="xs" />
            </div>
            <p className="mt-2 flex items-center gap-2 text-xs text-fg-2">
              <StatusDot tone={wrong ? 'danger' : IS_TESTNET ? 'warn' : 'accent'} />
              {wrong ? 'Wrong network' : AIDER_CHAIN_NAME}
            </p>
            {wrong && <SwitchNetworkButton size="sm" className="mt-3" />}
          </div>
          <a
            href={explorerAddress(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm text-fg-2 hover:bg-fg/[0.05] hover:text-fg"
          >
            <ArrowUpRight className="size-4" aria-hidden /> View on explorer
          </a>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              disconnect()
            }}
            className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm text-fg-2 hover:bg-fg/[0.05] hover:text-danger"
          >
            <LogOut className="size-4" aria-hidden /> Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
