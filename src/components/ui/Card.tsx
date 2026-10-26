import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** 20px-radius surface card with a hairline border. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-[20px] border border-line bg-surface', className)} {...rest} />
}

/** 28px-radius big panel (hero, live panel, footer). `tone="inset"` = near-black. */
export function Panel({
  className,
  tone = 'surface',
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tone?: 'surface' | 'inset' | 'outline' | 'plain' }) {
  return (
    <div
      className={cn(
        'rounded-[28px]',
        tone === 'surface' && 'border border-line bg-surface',
        tone === 'inset' && 'bg-inset',
        tone === 'outline' && 'border border-line-strong',
        className,
      )}
      {...rest}
    />
  )
}

/** Mock "device" screen: 26px bezel with a strong hairline around a 20px inner screen. */
export function Device({ className, innerClassName, children, ...rest }: HTMLAttributes<HTMLDivElement> & { innerClassName?: string }) {
  return (
    <div className={cn('rounded-[26px] border border-line-strong bg-surface-2/50 p-[6px]', className)} {...rest}>
      <div className={cn('h-full overflow-hidden rounded-[20px] border border-line bg-surface', innerClassName)}>{children}</div>
    </div>
  )
}
