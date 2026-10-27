import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, ExternalLink, ChevronRight } from 'lucide-react';
import { DOC_PAGES, DOC_SECTIONS, prevNext } from '../data/nav';
import { DocSearch } from './DocSearch';

const GITHUB = 'https://github.com/bigjoe-io/aider';

interface Props {
  children: ReactNode;
  slug: string;        // current page slug
  headings?: { id: string; text: string; level: number }[];
}

export function DocLayout({ children, slug, headings = [] }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { prev, next } = prevNext(slug);

  const githubEditUrl = slug
    ? `${GITHUB}/blob/main/cli/SKILL.md`  // generic fallback
    : GITHUB;

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="max-w-[90rem] mx-auto px-4 h-14 flex items-center gap-4">
          {/* Mobile burger */}
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-[var(--surface-muted)] transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>

          {/* Wordmark + breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="font-display font-semibold text-[var(--ink)] hover:opacity-75 transition-opacity">
              Aider
            </Link>
            <ChevronRight size={14} className="text-[var(--subtle)]" />
            <Link to="/docs" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
              Docs
            </Link>
          </div>

          {/* Spacer + search */}
          <div className="flex-1 max-w-xs hidden sm:block">
            <DocSearch />
          </div>

          <div className="flex-1 sm:hidden" />

          {/* GitHub */}
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors hidden sm:flex items-center gap-1"
          >
            <ExternalLink size={13} /> GitHub
          </a>
        </div>
      </header>

      <div className="flex-1 max-w-[90rem] mx-auto w-full flex">
        {/* ── Sidebar (desktop) ────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-[var(--border)] sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto py-6 px-4 gap-1">
          <div className="mb-4">
            <DocSearch />
          </div>
          <SidebarNav currentSlug={slug} />
        </aside>

        {/* ── Mobile sidebar overlay ───────────────────────────────────────── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-72 bg-[var(--bg)] border-r border-[var(--border)] overflow-y-auto flex flex-col py-6 px-4 gap-1">
              <div className="flex items-center justify-between mb-4">
                <Link to="/" className="font-display font-semibold text-[var(--ink)]" onClick={() => setSidebarOpen(false)}>
                  Aider
                </Link>
                <button onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                  <X size={18} />
                </button>
              </div>
              <DocSearch />
              <div className="mt-4">
                <SidebarNav currentSlug={slug} onNav={() => setSidebarOpen(false)} />
              </div>
            </aside>
          </div>
        )}

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-8 max-w-3xl">
          {children}

          {/* Prev / Next */}
          {(prev || next) && (
            <div className="mt-12 pt-6 border-t border-[var(--border)] flex items-center justify-between gap-4">
              {prev ? (
                <Link
                  to={`/docs/${prev.slug}`}
                  className="flex flex-col gap-0.5 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors max-w-[48%]"
                >
                  <span className="text-xs text-[var(--muted)]">← Previous</span>
                  <span className="text-sm font-medium text-[var(--ink)]">{prev.title}</span>
                </Link>
              ) : <div />}
              {next ? (
                <Link
                  to={`/docs/${next.slug}`}
                  className="flex flex-col gap-0.5 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors text-right max-w-[48%]"
                >
                  <span className="text-xs text-[var(--muted)]">Next →</span>
                  <span className="text-sm font-medium text-[var(--ink)]">{next.title}</span>
                </Link>
              ) : <div />}
            </div>
          )}

          {/* Edit on GitHub */}
          <div className="mt-6 text-center">
            <a
              href={githubEditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--subtle)] hover:text-[var(--ink)] transition-colors"
            >
              <ExternalLink size={11} /> Edit on GitHub
            </a>
          </div>
        </main>

        {/* ── On this page (TOC) ───────────────────────────────────────────── */}
        {headings.length > 0 && (
          <aside className="hidden xl:flex flex-col w-52 shrink-0 sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto py-8 px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--subtle)] mb-3">On this page</p>
            <nav className="flex flex-col gap-0.5">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors py-0.5 leading-snug ${h.level === 3 ? 'pl-3' : ''}`}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}

function SidebarNav({ currentSlug: _currentSlug, onNav }: { currentSlug: string; onNav?: () => void }) {
  return (
    <>
      {DOC_SECTIONS.map((section) => {
        const pages = DOC_PAGES.filter((p) => p.section === section && p.slug !== '');
        return (
          <div key={section} className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--subtle)] mb-1.5 px-2">{section}</p>
            {pages.map((p) => (
              <NavLink
                key={p.slug}
                to={`/docs/${p.slug}`}
                onClick={onNav}
                className={({ isActive }) =>
                  `block text-sm px-2 py-1.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                      : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-muted)]'
                  }`
                }
              >
                {p.title}
              </NavLink>
            ))}
          </div>
        );
      })}
    </>
  );
}
