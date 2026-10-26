import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'accent' | 'danger' | 'danger-ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,border-color,color,opacity,filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45'

const variants: Record<ButtonVariant, string> = {
  // inverse pill: fg background, bg text
  primary: 'rounded-full bg-fg text-bg hover:bg-fg/85',
  secondary: 'rounded-full border border-line-strong bg-surface text-fg hover:border-fg/30 hover:bg-surface-2',
  ghost: 'rounded-full text-fg-2 hover:bg-fg/[0.06] hover:text-fg',
  link: 'group rounded-md text-fg hover:text-fg/80',
  accent: 'rounded-full bg-accent text-accent-ink hover:brightness-110',
  danger: 'rounded-full bg-danger text-white hover:brightness-110',
  'danger-ghost': 'rounded-full border border-danger/40 text-danger hover:bg-danger/10',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-[13px]',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
}
const linkSizes: Record<ButtonSize, string> = { sm: 'text-[13px]', md: 'text-sm', lg: 'text-[15px]' }

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Icon before the label. */
  icon?: ReactNode
  /** Icon after the label. `link` buttons get an arrow by default. */
  iconRight?: ReactNode
  loading?: boolean
  className?: string
  children?: ReactNode
}

type AsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type AsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: string
    /** Open in a new tab with an ↗ arrow (auto for absolute http(s) URLs). */
    external?: boolean
    disabled?: boolean
  }
export type ButtonProps = AsButton | AsLink

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string): string {
  return cn(base, variants[variant], variant === 'link' ? cn('h-auto px-0', linkSizes[size]) : sizes[size], className)
}

/**
 * Pill button. Pass `href` to render a link (next/link for internal paths, <a target=_blank> for
 * external URLs). Server-component safe.
 */
export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', icon, iconRight, loading, className, children } = props
  const cls = buttonClasses(variant, size, className)
  const trailing =
    iconRight ??
    (variant === 'link' ? <ArrowRight aria-hidden className="size-[1em] transition-transform group-hover:translate-x-0.5" /> : null)
  const content = (
    <>
      {loading ? <Spinner className="size-[1.05em]" /> : icon}
      {children}
      {trailing}
    </>
  )

  if (props.href !== undefined) {
    const { href, external, variant: _v, size: _s, icon: _i, iconRight: _ir, loading: _l, className: _c, children: _ch, disabled, ...rest } = props
    const isExternal = external ?? /^https?:\/\//.test(href)
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cls}
          aria-disabled={disabled || undefined}
          {...rest}
        >
          {loading ? <Spinner className="size-[1.05em]" /> : icon}
          {children}
          {iconRight ?? <ArrowUpRight aria-hidden className="size-[1em]" />}
        </a>
      )
    }
    return (
      <Link href={href} className={cls} aria-disabled={disabled || undefined} {...rest}>
        {content}
      </Link>
    )
  }

  const { variant: _v, size: _s, icon: _i, iconRight: _ir, loading: _l, className: _c, children: _ch, type, disabled, ...rest } = props
  return (
    <button type={type ?? 'button'} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  )
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible name. */
  'aria-label': string
  size?: ButtonSize
  variant?: 'ghost' | 'secondary' | 'primary'
}

const iconSizes: Record<ButtonSize, string> = { sm: 'size-8', md: 'size-10', lg: 'size-12' }

/** Round icon-only button. Always give it an aria-label. */
export function IconButton({ size = 'md', variant = 'ghost', className, type, children, ...rest }: IconButtonProps) {
  return (
    <button type={type ?? 'button'} className={cn(base, variants[variant], iconSizes[size], 'p-0 [&_svg]:size-[18px]', className)} {...rest}>
      {children}
    </button>
  )
}

export interface IconLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  'aria-label': string
  href: string
  size?: ButtonSize
  variant?: 'ghost' | 'secondary'
}

/** Round icon-only external link (GitHub, X…). */
export function IconLink({ size = 'md', variant = 'ghost', className, children, ...rest }: IconLinkProps) {
  const external = /^https?:\/\//.test(rest.href)
  return (
    <a
      className={cn(base, variants[variant], iconSizes[size], 'p-0 [&_svg]:size-[18px]', className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}
