interface Props {
  title: string;
  summary: string;
  badge?: string;
}

export function PageHeader({ title, summary, badge }: Props) {
  return (
    <div className="mb-8 pb-6 border-b border-[var(--border)]">
      {badge && (
        <span className="inline-block mb-2 text-xs font-mono px-2 py-0.5 rounded border border-[var(--border)] text-[var(--muted)]">
          {badge}
        </span>
      )}
      <h1
        className="font-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-3 text-balance"
        style={{ letterSpacing: '-0.02em' }}
      >
        {title}
      </h1>
      <p className="text-[var(--muted)] text-lg leading-relaxed max-w-2xl">{summary}</p>
    </div>
  );
}

export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-display text-xl font-bold text-[var(--ink)] mt-10 mb-3 scroll-mt-20" style={{ letterSpacing: '-0.01em' }}>
      {children}
    </h2>
  );
}

export function H3({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="font-semibold text-[var(--ink)] mt-6 mb-2 scroll-mt-20">
      {children}
    </h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[var(--ink-2)] leading-relaxed mb-3 text-pretty">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5 text-[var(--ink-2)] text-sm mb-4">{children}</ul>;
}

export function OL({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal pl-5 space-y-1.5 text-[var(--ink-2)] text-sm mb-4">{children}</ol>;
}
