'use client'

import { Moon, Sun } from 'lucide-react'
import { THEME_MODES, useTheme, type ThemeMode } from '@/lib/theme'
import { Segmented } from '@/components/ui/Segmented'
import { cn } from '@/lib/cn'

const NAMES: Record<ThemeMode, string> = { dark: 'Dark', light: 'Light', auto: 'Auto' }

/** Half-moon style icon (circle, one half filled) — shown for "auto". */
function HalfMoon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Icon button cycling dark → light → auto. */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, cycle } = useTheme()
  const next = THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length]
  const Icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : HalfMoon
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${NAMES[mode]}. Switch to ${NAMES[next]}`}
      title={`Theme: ${NAMES[mode]}`}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-full text-fg-2 transition-colors hover:bg-fg/[0.06] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
    >
      <Icon className="size-[18px]" />
    </button>
  )
}

/** Light / Dark / Auto segmented control (footer, docs sidebar). */
export function ThemeSegmented({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'md' }) {
  const { mode, setMode } = useTheme()
  return (
    <Segmented<ThemeMode>
      label="Colour theme"
      size={size}
      className={className}
      value={mode}
      onChange={setMode}
      options={[
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'auto', label: 'Auto' },
      ]}
    />
  )
}
