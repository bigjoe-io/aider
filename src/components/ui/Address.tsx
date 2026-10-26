import { explorerAddress } from '@/aider/config'
import { shortAddr } from '@/aider/format'
import { cn } from '@/lib/cn'
import { CopyButton } from './CopyButton'

export interface AddressProps {
  address: string
  /** show the full address instead of 0x1234…abcd */
  full?: boolean
  copy?: boolean
  /** make the text an explorer link */
  link?: boolean
  className?: string
}

/** Monospace address (shortened by default) with copy and optional explorer link. */
export function Address({ address, full, copy = true, link, className }: AddressProps) {
  const text = full ? address : shortAddr(address)
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-0.5 font-mono text-[13px] text-fg-2', className)}>
      {link ? (
        <a
          href={explorerAddress(address)}
          target="_blank"
          rel="noopener noreferrer"
          title={address}
          className={cn('min-w-0 underline-offset-4 hover:text-fg hover:underline', full && 'break-all')}
        >
          {text}
        </a>
      ) : (
        <span title={address} className={cn('min-w-0', full && 'break-all')}>
          {text}
        </span>
      )}
      {copy && <CopyButton value={address} ariaLabel="Copy address" size="xs" />}
    </span>
  )
}
