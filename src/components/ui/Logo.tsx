import Link from 'next/link'
import { cn } from '@/lib/cn'

const INK = 'rgb(var(--logo-ink, var(--bg)))'

/**
 * Aider mark: a rounded square with three blocks stepping up (spending that grows within limits).
 * The square uses currentColor; the blocks use the page background colour.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <rect x="1" y="1" width="30" height="30" rx="8.5" fill="currentColor" />
      <g style={{ fill: INK }}>
        <rect x="7" y="19" width="6" height="6" rx="0.6" />
        <rect x="13" y="13" width="6" height="6" rx="0.6" />
        <rect x="19" y="7" width="6" height="6" rx="0.6" />
      </g>
    </svg>
  )
}

/** Mark + "Aider" wordmark. With `href` it is a home link. */
export function Logo({
  href,
  className,
  suffix,
  size = 'md',
}: {
  href?: string
  className?: string
  /** muted text after the wordmark, e.g. "Docs" */
  suffix?: string
  size?: 'sm' | 'md'
}) {
  const inner = (
    <>
      <LogoMark className={size === 'sm' ? 'size-6' : 'size-7'} />
      <span className={cn('font-medium tracking-[-0.02em] text-fg', size === 'sm' ? 'text-base' : 'text-[19px]')}>Aider</span>
      {suffix && <span className={cn('font-normal tracking-[-0.01em] text-fg-3', size === 'sm' ? 'text-base' : 'text-[19px]')}>{suffix}</span>}
    </>
  )
  const cls = cn('inline-flex items-center gap-2.5 text-fg', className)
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={suffix ? `Aider ${suffix} home` : 'Aider home'}>
        {inner}
      </Link>
    )
  }
  return <span className={cls}>{inner}</span>
}
