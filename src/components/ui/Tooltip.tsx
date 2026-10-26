import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * CSS-only tooltip shown on hover and keyboard focus. The wrapped child should be focusable
 * (a button or link) and carry its own accessible name; the tip is supplementary.
 */
export function Tooltip({ tip, side = 'top', children, className }: { tip: string; side?: 'top' | 'bottom'; children: ReactNode; className?: string }) {
  return (
    <span className={cn('tooltip inline-flex', className)} data-tip={tip} data-tip-side={side}>
      {children}
    </span>
  )
}
