import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { explorerAddress, explorerTx } from '@/aider/config'
import { shortAddr } from '@/aider/format'
import { cn } from '@/lib/cn'

export type ExplorerLinkProps =
  | { tx: string; address?: undefined; children?: ReactNode; className?: string; icon?: boolean }
  | { address: string; tx?: undefined; children?: ReactNode; className?: string; icon?: boolean }

/** Link to the Arc explorer for a tx hash or an address (new tab, ↗). */
export function ExplorerLink({ tx, address, children, className, icon = true }: ExplorerLinkProps) {
  const href = tx ? explorerTx(tx) : explorerAddress(address as string)
  const text = children ?? (tx ? shortAddr(tx, 6, 4) : shortAddr(address))
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex items-center gap-1 text-fg-2 underline-offset-4 transition-colors hover:text-fg hover:underline', className)}
    >
      {text}
      {icon && <ArrowUpRight aria-hidden className="size-3.5 shrink-0 opacity-70" />}
      <span className="sr-only"> (opens the Arc explorer)</span>
    </a>
  )
}
