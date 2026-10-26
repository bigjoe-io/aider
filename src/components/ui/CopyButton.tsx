'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

export interface CopyButtonProps {
  value: string
  /** Visible text next to the icon; omit for icon-only. */
  label?: string
  /** Accessible name for icon-only buttons. */
  ariaLabel?: string
  className?: string
  size?: 'xs' | 'sm' | 'md'
}

/** Copies `value`, flips to a check for 1.6 s and announces "Copied" to screen readers. */
export function CopyButton({ value, label, ariaLabel, className, size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const iconCls = size === 'xs' ? 'size-3.5' : 'size-4'
  return (
    <button
      type="button"
      aria-label={label ? undefined : (ariaLabel ?? 'Copy')}
      onClick={() => {
        void copyText(value).then((ok) => {
          if (!ok) return
          setCopied(true)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => setCopied(false), 1600)
        })
      }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-fg-3 transition-colors hover:bg-fg/[0.06] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        label ? 'h-8 px-2.5 text-xs font-medium' : size === 'xs' ? 'size-6' : size === 'sm' ? 'size-8' : 'size-9',
        copied && 'text-accent hover:text-accent',
        className,
      )}
    >
      {copied ? <Check className={iconCls} aria-hidden /> : <Copy className={iconCls} aria-hidden />}
      {label && <span>{copied ? 'Copied' : label}</span>}
      <span className="sr-only" aria-live="polite">
        {copied ? 'Copied' : ''}
      </span>
    </button>
  )
}
