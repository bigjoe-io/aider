'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useScrolled } from '@/lib/hooks'
import { ThemeToggle } from './ThemeToggle'

export interface NavLink {
  label: string
  href: string
}

/** Landing nav links. Hash links are absolute ("/#product") so they also work from other pages. */
export const SITE_NAV_LINKS: readonly NavLink[] = [
  { label: 'Product', href: '/#product' },
  { label: 'Agents', href: '/#agents' },
  { label: 'Developers', href: '/#developers' },
  { label: 'Security', href: '/#security' },
  { label: 'Docs', href: '/docs' },
]

/**
 * Sticky top nav: transparent at the top, blurred --bg/80 after scrolling. Logo · centre links ·
 * theme toggle + "Open app ↗". Mobile: menu sheet.
 */
export function SiteNav({ links = SITE_NAV_LINKS, className }: { links?: readonly NavLink[]; className?: string }) {
  const scrolled = useScrolled(8)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-200',
        scrolled || open ? 'border-b border-line bg-bg/80 backdrop-blur-xl backdrop-saturate-150' : 'border-b border-transparent',
        className,
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      <nav aria-label="Main" className="container-x flex h-16 items-center justify-between gap-6 md:h-[72px]">
        <Logo href="/" />
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-sm text-fg-2 transition-colors hover:text-fg">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <ThemeToggle />
          <Button href="/app" size="md" className="hidden sm:inline-flex" iconRight={<ArrowUpRight className="size-4" aria-hidden />}>
            Open app
          </Button>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full text-fg md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </nav>
      {open && (
        <div id="site-mobile-menu" className="container-x h-[calc(100dvh-64px)] animate-fade-in overflow-y-auto pb-10 pt-4 md:hidden">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href} className="border-b border-line">
                <Link href={l.href} onClick={() => setOpen(false)} className="flex h-14 items-center text-xl font-light tracking-[-0.01em] text-fg">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Button href="/app" size="lg" className="mt-8 w-full" onClick={() => setOpen(false)}>
            Open app
          </Button>
        </div>
      )}
    </header>
  )
}
