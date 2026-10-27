import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DOC_PAGES } from '../data/nav';

// Simple full-text search over page titles + summaries
function search(q: string) {
  if (!q.trim()) return [];
  const lower = q.toLowerCase();
  return DOC_PAGES.filter(
    (p) =>
      p.slug !== '' &&
      (p.title.toLowerCase().includes(lower) || p.summary.toLowerCase().includes(lower)),
  ).slice(0, 8);
}

export function DocSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const results = search(query);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)]
          bg-[var(--surface-muted)] text-[var(--muted)] text-sm hover:border-[var(--border-strong)]
          transition-colors w-full text-left"
        aria-label="Search documentation"
      >
        <Search size={14} />
        <span className="flex-1">Search docs…</span>
        <kbd className="hidden sm:inline text-xs bg-[var(--border)] rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg)' }}>
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
              <Search size={16} className="text-[var(--muted)] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documentation…"
                className="flex-1 bg-transparent text-[var(--ink)] placeholder:text-[var(--subtle)] text-sm outline-none"
              />
              <button onClick={() => setOpen(false)} aria-label="Close search">
                <X size={16} className="text-[var(--muted)] hover:text-[var(--ink)]" />
              </button>
            </div>
            {/* Results */}
            <div className="max-h-72 overflow-y-auto">
              {results.length === 0 && query.trim().length > 0 && (
                <p className="px-4 py-6 text-center text-sm text-[var(--subtle)]">No results for "{query}"</p>
              )}
              {results.length === 0 && query.trim().length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-[var(--subtle)]">Start typing to search</p>
              )}
              {results.map((p) => (
                <Link
                  key={p.slug}
                  to={`/docs/${p.slug}`}
                  onClick={() => { setOpen(false); setQuery(''); }}
                  className="flex flex-col gap-0.5 px-4 py-3 hover:bg-[var(--surface-muted)] transition-colors"
                >
                  <span className="text-xs text-[var(--muted)] uppercase tracking-wide">{p.section}</span>
                  <span className="text-sm font-medium text-[var(--ink)]">{p.title}</span>
                  <span className="text-xs text-[var(--subtle)]">{p.summary}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
