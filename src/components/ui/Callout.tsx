import type { ReactNode } from 'react'
import { AlertTriangle, Info, Lightbulb, OctagonAlert } from 'lucide-react'
import { cn } from '@/lib/cn'

export type CalloutTone = 'note' | 'tip' | 'warning' | 'danger'

const tones: Record<CalloutTone, { cls: string; icon: ReactNode; label: string }> = {
  note: { cls: 'border-line-strong bg-fg/[0.03] [--c:var(--fg-2)]', icon: <Info aria-hidden />, label: 'Note' },
  tip: { cls: 'border-accent/25 bg-accent/[0.07] [--c:var(--accent)]', icon: <Lightbulb aria-hidden />, label: 'Tip' },
  warning: { cls: 'border-warn/30 bg-warn/[0.08] [--c:var(--warn)]', icon: <AlertTriangle aria-hidden />, label: 'Warning' },
  danger: { cls: 'border-danger/30 bg-danger/[0.08] [--c:var(--danger)]', icon: <OctagonAlert aria-hidden />, label: 'Important' },
}

/** Note / tip / warning box. */
export function Callout({ tone = 'note', title, children, className }: { tone?: CalloutTone; title?: ReactNode; children: ReactNode; className?: string }) {
  const t = tones[tone]
  return (
    <div role="note" className={cn('flex gap-3 rounded-2xl border px-4 py-3.5 text-[15px] leading-relaxed text-fg-2', t.cls, className)}>
      <span className="mt-[3px] shrink-0 text-[rgb(var(--c))] [&_svg]:size-[18px]">{t.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-sm font-medium text-[rgb(var(--c))]">{title ?? t.label}</p>
        <div className="[&_a]:text-fg [&_a]:underline [&_a]:decoration-fg-3 [&_a]:underline-offset-2 [&>p+p]:mt-2">{children}</div>
      </div>
    </div>
  )
}
