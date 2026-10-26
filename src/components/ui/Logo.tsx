import Link from 'next/link'
import { cn } from '@/lib/cn'

const INK = 'rgb(var(--logo-ink, var(--bg)))'

/**
 * Aider mark (original): a rounded square with a tilted kite — diamond body, cross spars and a short
 * curved string tail. The square uses currentColor; the kite uses the page background colour.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <rect x="1" y="1" width="30" height="30" rx="8.5" fill="currentColor" />
      <g transform="rotate(-14 17 13)">
        <path d="M17 4.6 L23.4 12.4 L17 23.2 L10.6 12.4 Z" style={{ fill: INK }} />
        <path
          d="M17 6.4 V21.4 M12.4 12.4 H21.6"
          strokeWidth="0.9"
          strokeLinecap="round"
          style={{ stroke: 'currentColor', strokeOpacity: 0.5 }}
        />
      </g>
      <path
        d="M19.6 23.9 C 18.4 25.3, 21.6 25.9, 20.2 27.4 C 19.4 28.2, 21 28.8, 22.2 28.4"
        fill="none"
        strokeWidth="1.25"
        strokeLinecap="round"
        style={{ stroke: INK }}
      />
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
