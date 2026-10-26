import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type Tone = 'ok' | 'warn' | 'danger' | 'neutral' | 'accent'

const toneText: Record<Tone, string> = {
  ok: 'text-accent',
  accent: 'text-accent',
  warn: 'text-warn',
  danger: 'text-danger',
  neutral: 'text-fg-2',
}
const toneDot: Record<Tone, string> = {
  ok: 'bg-accent',
  accent: 'bg-accent',
  warn: 'bg-warn',
  danger: 'bg-danger',
  neutral: 'bg-fg-3',
}
const toneBg: Record<Tone, string> = {
  ok: 'bg-accent/10 border-accent/20',
  accent: 'bg-accent/10 border-accent/20',
  warn: 'bg-warn/10 border-warn/25',
  danger: 'bg-danger/10 border-danger/25',
  neutral: 'bg-fg/[0.04] border-line-strong',
}

/** Small rounded label (e.g. "Preview", "Example", counts). */
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-xs font-medium leading-none',
        toneBg[tone],
        tone === 'neutral' ? 'text-fg-2' : toneText[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Dot + text status pill: Active / Revoked / Waiting for you… */
export function StatusPill({
  children,
  tone = 'neutral',
  pulse,
  className,
  bare,
}: {
  children: ReactNode
  tone?: Tone
  /** animate the dot (live / pending) */
  pulse?: boolean
  className?: string
  /** no background/border, just dot + text */
  bare?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium',
        !bare && 'h-7 rounded-full border px-3',
        !bare && toneBg[tone],
        tone === 'neutral' ? 'text-fg-2' : toneText[tone],
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {pulse && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', toneDot[tone])} />}
        <span className={cn('relative size-1.5 rounded-full', toneDot[tone])} />
      </span>
      {children}
    </span>
  )
}

/** Just the coloured dot. */
export function StatusDot({ tone = 'neutral', className }: { tone?: Tone; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-1.5 rounded-full', toneDot[tone], className)} />
}
