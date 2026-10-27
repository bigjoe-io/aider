'use client'

import { NETWORKS, switchNetwork, type AiderNetwork } from '@/aider/config'
import { cn } from '@/lib/cn'

/** Testnet / Mainnet switch. Switching saves the choice and reloads the page. */
export function NetworkSwitch({ className }: { className?: string }) {
  return (
    <div role="group" aria-label="Network" className={cn('net-switch inline-flex items-center rounded-full border border-line p-0.5 text-[13px]', className)}>
      {(['testnet', 'mainnet'] as AiderNetwork[]).map((n) => (
        <button
          key={n}
          type="button"
          data-value={n}
          onClick={() => switchNetwork(n)}
          className="net-switch-btn inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-fg-3 transition-colors hover:text-fg"
        >
          <span className={cn('size-1.5 rounded-full', n === 'testnet' ? 'bg-warn' : 'bg-accent')} aria-hidden />
          {NETWORKS[n].label}
        </button>
      ))}
    </div>
  )
}
