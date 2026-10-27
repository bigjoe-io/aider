import { CopyButton } from './CopyButton';
import { InView } from './InView';

const INIT_CMD = 'aidr init --wallet <id> --key <agent-key>';
const SKILL_URL = 'https://github.com/bigjoe-io/aider/blob/main/cli/SKILL.md';

export function Hero() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
      <InView>
        <h1
          className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--ink)] text-balance leading-tight mb-5"
          style={{ letterSpacing: '-0.03em' }}
        >
          Your agent spends.<br className="hidden sm:block" /> You stay in control.
        </h1>
      </InView>

      <InView delay={80}>
        <p className="text-lg sm:text-xl text-[var(--muted)] text-pretty max-w-2xl mx-auto mb-8 leading-relaxed">
          A USDC wallet for AI agents on Arc. You set the limits, approve the big
          payments and revoke access in one click. Every rule is enforced onchain.
        </p>
      </InView>

      <InView delay={140}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <a
            href="#for-agents"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-sm
              bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 transition-opacity min-h-[44px]"
          >
            Open app
          </a>
          <a
            href={SKILL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-sm
              border border-[var(--border-strong)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink)]
              transition-colors min-h-[44px]"
          >
            Read SKILL.md
          </a>
        </div>
      </InView>

      {/* Command box */}
      <InView delay={200}>
        <div className="inline-block w-full max-w-xl text-left">
          <div
            className="rounded-xl overflow-hidden border border-[var(--border-strong)]"
            style={{ background: 'var(--code-bg)' }}
          >
            {/* Dot row */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="ml-2 text-xs text-white/30 font-mono">setup</span>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <code
                className="font-mono text-sm sm:text-base text-[var(--code-fg)] select-all break-all"
              >
                <span className="text-white/40 mr-2">$</span>{INIT_CMD}
              </code>
              <div className="shrink-0">
                <CopyButton
                  text={INIT_CMD}
                  className="!border-white/20 !text-white/50 hover:!text-white/90 hover:!border-white/50"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-[var(--subtle)] text-center mt-3">
            Experimental · Unaudited · Use small amounts
          </p>
        </div>
      </InView>
    </section>
  );
}
