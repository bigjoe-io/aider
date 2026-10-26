'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUp, Check, Copy, Github, ListTree, Menu, Search, X } from 'lucide-react'
import { buttonClasses, Dialog, Logo } from '@/components/ui'
import { ThemeSegmented, ThemeToggle } from '@/components/site'
import { GITHUB_URL } from '@/aider/config'
import { cn } from '@/lib/cn'
import { isDocsHost, mainOrigin } from '@/lib/hosts'
import { useMounted } from '@/lib/hooks'

export interface NavPage {
  slug: string
  title: string
  group: string
}
export interface NavGroup {
  group: string
  pages: NavPage[]
}
export interface SearchDoc {
  slug: string
  title: string
  group: string
  summary: string
  headings: string[]
  text: string
}

export const DOCS_TABS = [
  { label: 'Overview', slug: '' },
  { label: 'Get started', slug: 'introduction', group: 'Get started' },
  { label: 'Concepts', slug: 'agent-payments', group: 'Core concepts' },
  { label: 'Security', slug: 'security-model', group: 'Security' },
  { label: 'CLI', slug: 'cli-reference' },
  { label: 'Contract', slug: 'contract-reference' },
] as const

/** '' on a docs.* host (pages live at the root), '/docs' on the main host. */
export function useDocsBase(): string {
  const mounted = useMounted()
  return mounted && isDocsHost() ? '' : '/docs'
}

export function docPath(base: string, slug: string): string {
  if (!slug) return base || '/'
  return `${base}/${slug}`
}

function useCurrentSlug(): string {
  const pathname = usePathname() ?? '/'
  const parts = pathname.replace(/^\/docs/, '').split('/').filter(Boolean)
  return parts[0] ?? ''
}

export function DocsTopBar({ groups, index }: { groups: NavGroup[]; index: SearchDoc[] }) {
  const base = useDocsBase()
  const slug = useCurrentSlug()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const currentGroup = groups.find((g) => g.pages.some((p) => p.slug === slug))?.group

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const activeTab = (tab: (typeof DOCS_TABS)[number]) => {
    if (tab.slug === '') return slug === ''
    if (tab.slug === slug) return true
    return 'group' in tab && tab.group === currentGroup && !DOCS_TABS.some((t) => t.slug === slug)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-5 sm:px-8">
        <button type="button" aria-label="Open docs menu" className="-ml-1 rounded-lg p-1.5 text-fg-2 hover:text-fg lg:hidden" onClick={() => setMenuOpen(true)}>
          <Menu className="size-5" />
        </button>
        <Link href={docPath(base, '')} className="flex items-center gap-2.5" aria-label="Aider docs home">
          <Logo />
          <span className="text-[17px] text-fg-3">Docs</span>
        </Link>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="mx-auto hidden h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 text-left text-sm text-fg-3 transition-colors hover:border-line-strong md:flex"
        >
          <Search className="size-4" />
          <span className="flex-1">Search the docs</span>
          <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">⌘K</kbd>
        </button>
        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <button type="button" aria-label="Search the docs" onClick={() => setSearchOpen(true)} className="rounded-lg p-2 text-fg-2 hover:text-fg md:hidden">
            <Search className="size-[18px]" />
          </button>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-fg-2 hover:text-fg sm:flex">
            <Github className="size-4" /> GitHub
          </a>
          <ThemeToggle />
          <OpenAppLink />
        </div>
      </div>
      <nav aria-label="Docs sections" className="mx-auto hidden max-w-[1440px] gap-7 overflow-x-auto px-5 sm:px-8 md:flex">
        {DOCS_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={docPath(base, tab.slug)}
            className={cn(
              'relative whitespace-nowrap pb-3 pt-1 text-[15px] transition-colors',
              activeTab(tab) ? 'text-fg after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-fg' : 'text-fg-2 hover:text-fg',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} index={index} />
      {menuOpen && <MobileNav groups={groups} onClose={() => setMenuOpen(false)} />}
    </header>
  )
}

/** "Open app" always goes to the main host, also when the docs are served from docs.* */
function OpenAppLink() {
  const mounted = useMounted()
  const href = mounted && isDocsHost() ? `${mainOrigin()}/app` : '/app'
  return (
    <a href={href} className={buttonClasses('primary', 'sm', 'ml-1')}>
      Open app
    </a>
  )
}

export function DocsSidebar({ groups, className, onNavigate }: { groups: NavGroup[]; className?: string; onNavigate?: () => void }) {
  const base = useDocsBase()
  const slug = useCurrentSlug()
  return (
    <nav aria-label="Docs pages" className={cn('flex flex-col', className)}>
      {groups.map((g) => (
        <div key={g.group} className="mb-7">
          <p className="label mb-2.5 px-3">{g.group}</p>
          <ul className="space-y-0.5">
            {g.pages.map((p) => {
              const active = p.slug === slug
              return (
                <li key={p.slug}>
                  <Link
                    href={docPath(base, p.slug)}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'block rounded-xl px-3 py-[7px] text-[15px] transition-colors',
                      active ? 'bg-surface-2 text-fg' : 'text-fg-2 hover:bg-surface-2/60 hover:text-fg',
                    )}
                  >
                    {p.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-3 pt-5">
        <span className="text-sm text-fg-3">Appearance</span>
        <ThemeSegmented />
      </div>
    </nav>
  )
}

function MobileNav({ groups, onClose }: { groups: NavGroup[]; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Docs menu">
      <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col overflow-y-auto border-r border-line bg-bg p-4">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button type="button" aria-label="Close menu" onClick={onClose} className="rounded-lg p-1.5 text-fg-2 hover:text-fg">
            <X className="size-5" />
          </button>
        </div>
        <DocsSidebar groups={groups} onNavigate={onClose} className="flex-1" />
      </div>
    </div>
  )
}

export function Toc({ items }: { items: { id: string; text: string; level: 2 | 3 }[] }) {
  const [active, setActive] = useState<string | undefined>(items[0]?.id)
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e)
    if (els.length === 0) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -65% 0px' },
    )
    els.forEach((e) => obs.observe(e))
    return () => obs.disconnect()
  }, [items])
  if (items.length === 0) return null
  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="label mb-4 flex items-center gap-2">
        <ListTree className="size-3.5" /> On this page
      </p>
      <ul className="space-y-1 border-l border-line">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className={cn(
                '-ml-px block border-l py-1.5 transition-colors',
                i.level === 3 ? 'pl-6' : 'pl-4',
                active === i.id ? 'border-fg text-fg' : 'border-transparent text-fg-2 hover:text-fg',
              )}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ul>
      <a href="#top" className="mt-6 inline-flex items-center gap-1.5 text-fg-3 hover:text-fg">
        Back to top <ArrowUp className="size-3.5" />
      </a>
    </nav>
  )
}

export function CopyPageButton({ markdown }: { markdown: string }) {
  const [done, setDone] = useState(false)
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setDone(true)
      setTimeout(() => setDone(false), 1800)
    } catch {
      setDone(false)
    }
  }, [markdown])
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[13px] text-fg-2 transition-colors hover:border-line-strong hover:text-fg"
    >
      {done ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
      {done ? 'Copied' : 'Copy page'}
    </button>
  )
}

/** Base-aware link for server-rendered docs content (cards, prev/next, chips). */
export function DocLink({ slug, className, children }: { slug: string; className?: string; children: React.ReactNode }) {
  const base = useDocsBase()
  return (
    <Link href={docPath(base, slug)} className={className}>
      {children}
    </Link>
  )
}

function score(doc: SearchDoc, terms: string[]): number {
  let s = 0
  const title = doc.title.toLowerCase()
  const heads = doc.headings.join(' ').toLowerCase()
  const summary = doc.summary.toLowerCase()
  const text = doc.text.toLowerCase()
  for (const t of terms) {
    if (title.includes(t)) s += 10
    if (heads.includes(t)) s += 5
    if (summary.includes(t)) s += 3
    if (text.includes(t)) s += 1
    else if (!title.includes(t) && !heads.includes(t) && !summary.includes(t)) return 0
  }
  return s
}

function SearchPalette({ open, onClose, index }: { open: boolean; onClose: () => void; index: SearchDoc[] }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const router = useRouter()
  const base = useDocsBase()
  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return index.slice(0, 8)
    return index
      .map((d) => ({ d, s: score(d, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 10)
      .map((r) => r.d)
  }, [q, index])

  const close = () => {
    setQ('')
    setSel(0)
    onClose()
  }

  const go = (slug: string) => {
    close()
    router.push(docPath(base, slug))
  }

  return (
    <Dialog open={open} onClose={close} title="Search the docs" hideTitle position="top" size="lg">
      <div className="-mx-1">
        <div className="flex items-center gap-3 border-b border-line px-1 pb-3">
          <Search className="size-[18px] text-fg-3" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setSel(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSel((s) => Math.min(s + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSel((s) => Math.max(s - 1, 0))
              } else if (e.key === 'Enter' && results[sel]) go(results[sel].slug)
            }}
            placeholder="Search pages, errors, commands…"
            aria-label="Search the docs"
            className="h-9 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-3"
          />
        </div>
        <ul role="listbox" aria-label="Results" className="mt-2 max-h-[55vh] overflow-y-auto">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-fg-3">No pages match “{q}”.</li>}
          {results.map((r, i) => (
            <li key={r.slug} role="option" aria-selected={i === sel}>
              <button
                type="button"
                onMouseEnter={() => setSel(i)}
                onClick={() => go(r.slug)}
                className={cn('w-full rounded-xl px-3 py-2.5 text-left', i === sel ? 'bg-surface-2' : '')}
              >
                <span className="block text-[15px] text-fg">{r.title}</span>
                <span className="mt-0.5 block truncate text-[13px] text-fg-3">
                  {r.group} · {r.summary}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  )
}
