import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const GITHUB = 'https://github.com/bigjoe-io/aider';

const links = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Rules',        href: '#rules' },
  { label: 'For agents',   href: '#for-agents' },
  { label: 'FAQ',          href: '#faq' },
  { label: 'GitHub',       href: GITHUB },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)] backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <a
          href="#"
          className="font-display text-lg font-semibold text-[var(--ink)] tracking-tight leading-none"
        >
          Aider
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-[var(--muted)]">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="hover:text-[var(--ink)] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#for-agents"
            className="text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            Open app
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          className="md:hidden p-2 text-[var(--muted)] hover:text-[var(--ink)]"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg)] px-4 pb-4 pt-2 flex flex-col gap-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--ink-2)] hover:text-[var(--ink)] py-1"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#for-agents"
            onClick={() => setOpen(false)}
            className="mt-1 text-sm font-medium text-[var(--accent-fg)] bg-[var(--accent)] hover:opacity-90
              px-4 py-2 rounded-lg text-center transition-opacity"
          >
            Open app
          </a>
        </div>
      )}
    </header>
  );
}
