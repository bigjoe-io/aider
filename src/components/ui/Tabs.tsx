'use client'

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TabItem<T extends string = string> {
  value: T
  label: ReactNode
  content?: ReactNode
  badge?: ReactNode
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[]
  /** controlled value */
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  label: string
  variant?: 'underline' | 'pill'
  className?: string
  listClassName?: string
  panelClassName?: string
}

/** Accessible tabs (role=tablist, arrow keys). Renders the active item's `content` in a tabpanel. */
export function Tabs<T extends string>({
  items,
  value,
  defaultValue,
  onChange,
  label,
  variant = 'underline',
  className,
  listClassName,
  panelClassName,
}: TabsProps<T>) {
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? items[0]?.value)
  const current = value ?? inner
  const base = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function select(v: T) {
    if (value === undefined) setInner(v)
    onChange?.(v)
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    let n: number | undefined
    if (e.key === 'ArrowRight') n = (i + 1) % items.length
    else if (e.key === 'ArrowLeft') n = (i - 1 + items.length) % items.length
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = items.length - 1
    if (n === undefined) return
    e.preventDefault()
    select(items[n].value)
    refs.current[n]?.focus()
  }

  const active = items.find((i) => i.value === current)
  const hasContent = items.some((i) => i.content !== undefined)

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className={cn(
          'flex items-center gap-1 overflow-x-auto scrollbar-none',
          variant === 'underline' && 'gap-6 border-b border-line',
          variant === 'pill' && 'rounded-full border border-line bg-fg/[0.04] p-1',
          listClassName,
        )}
      >
        {items.map((item, i) => {
          const selected = item.value === current
          return (
            <button
              key={item.value}
              ref={(el) => {
                refs.current[i] = el
              }}
              id={`${base}-tab-${item.value}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={hasContent ? `${base}-panel-${item.value}` : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                variant === 'underline' &&
                  cn('-mb-px h-11 border-b-2', selected ? 'border-fg text-fg' : 'border-transparent text-fg-3 hover:text-fg'),
                variant === 'pill' && cn('h-8 rounded-full px-3.5', selected ? 'bg-fg/[0.1] text-fg' : 'text-fg-3 hover:text-fg'),
              )}
            >
              {item.label}
              {item.badge}
            </button>
          )
        })}
      </div>
      {hasContent && active && (
        <div
          role="tabpanel"
          id={`${base}-panel-${active.value}`}
          aria-labelledby={`${base}-tab-${active.value}`}
          tabIndex={0}
          className={cn('focus-visible:outline-none', panelClassName)}
        >
          {active.content}
        </div>
      )}
    </div>
  )
}
