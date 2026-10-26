import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { AIDER_ADDRESS, AIDER_CHAIN_NAME, ARC_STUDIO_URL, EXPLORER_BASE, GITHUB_URL, X_URL, explorerAddress } from '@/aider/config'
import { Button, IconLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/cn'
import { FooterArt } from './FooterArt'
import { ThemeSegmented } from './ThemeToggle'

interface FooterLink {
  label: string
  href: string
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Open app', href: '/app' },
      { label: 'Agents', href: '/app/agents' },
      { label: 'Approvals', href: '/app/approvals' },
      { label: 'Activity', href: '/app/activity' },
      { label: 'Rules', href: '/app/rules' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'Quickstart', href: '/docs/quickstart-owners' },
      { label: 'CLI reference', href: '/docs/cli-reference' },
      { label: 'SKILL.md', href: '/docs/skill-md' },
      { label: 'Contract reference', href: '/docs/contract-reference' },
      { label: 'llms.txt', href: '/llms.txt' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub', href: GITHUB_URL },
      { label: 'Security model', href: '/docs/security-model' },
      { label: 'Errors', href: '/docs/errors' },
      { label: 'Glossary', href: '/docs/glossary' },
      { label: 'Arc explorer', href: EXPLORER_BASE },
      { label: 'Arc Studio', href: ARC_STUDIO_URL },
    ],
  },
]

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.36 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2Z" />
    </svg>
  )
}

function FooterLinkItem({ link }: { link: FooterLink }) {
  const external = /^https?:\/\//.test(link.href)
  const cls = 'inline-flex items-center gap-1 text-[15px] text-fg-2 transition-colors hover:text-fg'
  if (external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
        {link.label}
        <ArrowUpRight aria-hidden className="size-3.5 opacity-60" />
      </a>
    )
  }
  return (
    <Link href={link.href} className={cls}>
      {link.label}
    </Link>
  )
}

/**
 * Site footer: near-black rounded card (dark in both themes) with tagline, link columns, contract
 * line, theme switch and the original kite engraving. Server component (theme switch is a client island).
 */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('container-x pb-6 pt-16 md:pt-24', className)}>
      <div className="theme-dark overflow-hidden rounded-[28px] bg-inset text-fg">
        <div className="px-6 pt-12 sm:px-10 md:px-16 md:pt-16 lg:px-[100px]">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1.9fr] lg:gap-16">
            <div className="flex flex-col items-start">
              <Logo href="/" />
              <p className="mt-6 max-w-[17ch] text-[28px] font-light leading-[1.15] tracking-[-0.02em] text-fg">
                Your agent spends. You stay in control.
              </p>
              <p className="mt-4 text-sm text-fg-3">Built on Arc with Arc Studio</p>
              <div className="mt-7 flex items-center gap-1">
                <IconLink href={GITHUB_URL} aria-label="Aider on GitHub" className="text-fg-2">
                  <GithubIcon />
                </IconLink>
                {X_URL && (
                  <IconLink href={X_URL} aria-label="Aider on X" className="text-fg-2">
                    <XIcon />
                  </IconLink>
                )}
                <Button href="/app" size="sm" className="ml-2 h-9 px-4">
                  Open app
                </Button>
              </div>
            </div>
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
              {COLUMNS.map((col) => (
                <div key={col.title}>
                  <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-fg">{col.title}</h2>
                  <ul className="mt-5 flex flex-col gap-3">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <FooterLinkItem link={l} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <p className="mt-14 text-[13px] leading-relaxed text-fg-3">
            {AIDER_ADDRESS ? (
              <>
                Aider contract on {AIDER_CHAIN_NAME}:{' '}
                <a
                  href={explorerAddress(AIDER_ADDRESS)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-mono text-fg-2 underline-offset-4 hover:text-fg hover:underline"
                >
                  {AIDER_ADDRESS}
                </a>
              </>
            ) : (
              <>Aider is not deployed on {AIDER_CHAIN_NAME} yet.</>
            )}
          </p>

          <div className="mt-6 flex flex-col gap-5 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
            <p className="text-[13px] text-fg-3">© 2026 Aider. Experimental software — unaudited, use small amounts.</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <ThemeSegmented />
              <ul className="flex items-center gap-3 text-[13px] text-fg-3">
                <li>
                  <Link href="/docs/security-model" className="hover:text-fg">
                    Security
                  </Link>
                </li>
                <li aria-hidden className="text-fg/20">
                  |
                </li>
                <li>
                  <Link href="/docs/errors" className="hover:text-fg">
                    Errors
                  </Link>
                </li>
                <li aria-hidden className="text-fg/20">
                  |
                </li>
                <li>
                  <a href="/llms.txt" className="hover:text-fg">
                    llms.txt
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <FooterArt className="mt-8" />
      </div>
    </footer>
  )
}
