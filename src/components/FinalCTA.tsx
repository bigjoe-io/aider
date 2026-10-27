import { InView } from './InView';

const GITHUB = 'https://github.com/bigjoe-io/aider';

export function FinalCTA() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--surface-muted)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <InView>
          <h2
            className="font-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-4 text-balance"
            style={{ letterSpacing: '-0.02em' }}
          >
            Give your agent a wallet you can trust.
          </h2>
          <p className="text-[var(--muted)] mb-8">
            Spending limits, approval flows, and instant revoke — all enforced onchain.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#for-agents"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl
                font-medium text-sm bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90
                transition-opacity min-h-[44px]"
            >
              Open app
            </a>
            <a
              href={GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl
                font-medium text-sm border border-[var(--border-strong)] text-[var(--ink-2)]
                hover:text-[var(--ink)] hover:border-[var(--ink)] transition-colors min-h-[44px]"
            >
              View on GitHub
            </a>
          </div>
        </InView>
      </div>
    </section>
  );
}
