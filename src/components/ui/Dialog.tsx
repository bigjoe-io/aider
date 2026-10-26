'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useMounted } from '@/lib/hooks'

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

let openCount = 0

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Footer row (buttons), right-aligned. */
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Don't close on overlay click / Esc (e.g. while a transaction is pending). */
  dismissible?: boolean
  /** Hide the visible title (still used as the accessible name). */
  hideTitle?: boolean
  /** Position: centered (default) or top (command palette). */
  position?: 'center' | 'top'
  className?: string
  /** Element to focus first (otherwise the first focusable in the body). */
  initialFocus?: React.RefObject<HTMLElement | null>
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

/** Accessible modal: portal, focus trap, Esc, overlay click, body scroll lock, focus restore. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
  hideTitle,
  position = 'center',
  className,
  initialFocus,
}: DialogProps) {
  const mounted = useMounted()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()
  const onCloseRef = useRef(onClose)
  const dismissibleRef = useRef(dismissible)
  useEffect(() => {
    onCloseRef.current = onClose
    dismissibleRef.current = dismissible
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null

    // scroll lock (ref-counted for nested dialogs)
    const body = document.body
    const prevOverflow = body.style.overflow
    const prevPadding = body.style.paddingRight
    if (openCount === 0) {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth
      body.style.overflow = 'hidden'
      if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
    }
    openCount++

    const panel = panelRef.current
    const focusFirst = () => {
      const target = initialFocus?.current ?? panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
      ;(target ?? panel)?.focus()
    }
    const raf = requestAnimationFrame(focusFirst)

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (dismissibleRef.current) {
          e.stopPropagation()
          onCloseRef.current()
        }
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (items.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const activeEl = document.activeElement
      if (e.shiftKey && (activeEl === first || activeEl === panel)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault()
        first.focus()
      } else if (!panel.contains(activeEl)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey, true)
      openCount--
      if (openCount === 0) {
        body.style.overflow = prevOverflow
        body.style.paddingRight = prevPadding
      }
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus()
    }
  }, [open, initialFocus])

  if (!mounted || !open) return null

  return createPortal(
    <div className={cn('fixed inset-0 z-[100] flex justify-center p-4 sm:p-6', position === 'center' ? 'items-center' : 'items-start pt-[12vh]')}>
      <div
        aria-hidden
        className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-[3px]"
        onClick={() => {
          if (dismissible) onClose()
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[min(88dvh,820px)] w-full animate-scale-in flex-col overflow-hidden rounded-[22px] border border-line-strong bg-surface text-fg shadow-[var(--shadow-pop)] focus:outline-none',
          sizes[size],
          className,
        )}
      >
        <div className={cn('flex items-start justify-between gap-4 px-6 pt-5', hideTitle && 'sr-only')}>
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-normal leading-snug tracking-[-0.01em]">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm leading-relaxed text-fg-2">
                {description}
              </p>
            )}
          </div>
          {dismissible && !hideTitle && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="-mr-2 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-fg-3 transition-colors hover:bg-fg/[0.06] hover:text-fg"
            >
              <X className="size-[18px]" aria-hidden />
            </button>
          )}
        </div>
        {children !== undefined && <div className={cn('min-h-0 flex-1 overflow-y-auto px-6', hideTitle ? 'py-4' : 'pb-5 pt-4')}>{children}</div>}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-fg/[0.015] px-6 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
