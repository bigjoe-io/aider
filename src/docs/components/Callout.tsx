import { Info, Lightbulb, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

type Kind = 'note' | 'tip' | 'warning';

const META: Record<Kind, { icon: typeof Info; label: string; classes: string }> = {
  note:    { icon: Info,          label: 'Note',    classes: 'border-[var(--focus)] bg-[var(--focus)]/10 text-[var(--ink-2)]' },
  tip:     { icon: Lightbulb,     label: 'Tip',     classes: 'border-[var(--success)] bg-[var(--success)]/10 text-[var(--ink-2)]' },
  warning: { icon: TriangleAlert, label: 'Warning', classes: 'border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--ink)]' },
};

export function Callout({ kind = 'note', children }: { kind?: Kind; children: ReactNode }) {
  const { icon: Icon, label, classes } = META[kind];
  return (
    <div className={`my-4 flex gap-3 rounded-lg border-l-4 px-4 py-3 ${classes}`}>
      <Icon size={16} className="mt-0.5 shrink-0 opacity-80" />
      <div>
        <span className="font-semibold text-sm mr-1.5">{label}:</span>
        <span className="text-sm leading-relaxed">{children}</span>
      </div>
    </div>
  );
}
