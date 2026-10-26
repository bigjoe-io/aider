import { cn } from '@/lib/cn'

export interface ToggleProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  /** Accessible name (or use aria-labelledby). */
  label?: string
  labelledBy?: string
  disabled?: boolean
  tone?: 'accent' | 'danger'
  size?: 'sm' | 'md'
  className?: string
}

/** Switch (role=switch). */
export function Toggle({ checked, onChange, label, labelledBy, disabled, tone = 'accent', size = 'md', className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-45',
        size === 'md' ? 'h-6 w-10' : 'h-5 w-8',
        checked
          ? tone === 'danger'
            ? 'border-danger/60 bg-danger'
            : 'border-accent/60 bg-accent'
          : 'border-line-strong bg-fg/[0.08]',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute left-0.5 rounded-full shadow-sm transition-transform',
          size === 'md' ? 'size-[18px]' : 'size-3.5',
          checked ? cn('bg-white', size === 'md' ? 'translate-x-4' : 'translate-x-3') : 'bg-fg/70',
        )}
      />
    </button>
  )
}
