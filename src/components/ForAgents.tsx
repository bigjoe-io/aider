import { ExternalLink } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { InView } from './InView';

const SKILL_RAW_URL =
  'https://raw.githubusercontent.com/bigjoe-io/aider/main/cli/SKILL.md';
const SKILL_URL =
  'https://github.com/bigjoe-io/aider/blob/main/cli/SKILL.md';

// Inline the key commands for display — source of truth is cli/SKILL.md
const COMMANDS = [
  { cmd: 'aidr balance',                     desc: 'Check wallet balance and your limits before paying' },
  { cmd: 'aidr pay <to> <amount> "<memo>"',  desc: 'Pay immediately, or request approval if over a limit' },
  { cmd: 'aidr status <requestId>',          desc: 'Check status: pending / approved / rejected / expired' },
  { cmd: 'aidr wait <requestId>',            desc: 'Poll every 5 s until the request resolves' },
  { cmd: 'aidr history',                     desc: 'Recent payments with explorer links' },
];

// Condensed SKILL.md for display
const SKILL_EXCERPT = `# Aider — AI Agent Payment Skill

\`aidr\` lets an AI agent spend USDC from a human-owned Aider wallet.
All output is JSON so you can parse it programmatically.

## Setup
\`\`\`
aidr init --wallet <id> --key <agent-key>
\`\`\`

## Always do this before paying
\`\`\`
balance = JSON.parse(run("aidr balance"))
if balance.wallet.paused:   stop("Wallet paused")
if not balance.agent.active: stop("Agent revoked")
\`\`\`

## Pay
\`\`\`
result = JSON.parse(run(\`aidr pay \${to} \${amount} "\${memo}"\`))
if result.status == "paid":             // done
if result.status == "pending_approval": // tell the user, then aidr wait
if result.status == "error":            // surface result.message
\`\`\`

## Rules (never break these)
1. Check balance before every payment.
2. Write honest memos. The owner reads them.
3. Never split payments to stay under a limit.
4. Report pending approvals — don't pretend they went through.
5. Stop on revocation or expiry. Don't retry.
6. Never print, log, or transmit the key.

See the full SKILL.md on GitHub for the complete error table and examples.`;

export function ForAgents() {
  return (
    <section id="for-agents" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <InView>
        <h2
          className="font-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-3 text-center"
          style={{ letterSpacing: '-0.02em' }}
        >
          For agents
        </h2>
        <p className="text-[var(--muted)] text-center mb-10">Give this to your agent.</p>
      </InView>

      {/* CLI commands */}
      <InView delay={60}>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-muted)]">
            <h3 className="font-semibold text-sm text-[var(--ink)]">CLI commands</h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {COMMANDS.map(({ cmd, desc }) => (
              <div key={cmd} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 px-5 py-3.5">
                <code className="font-mono text-xs text-[var(--ink)] shrink-0 w-full sm:w-72 break-all">
                  {cmd}
                </code>
                <span className="text-sm text-[var(--muted)]">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </InView>

      {/* SKILL.md */}
      <InView delay={100}>
        <div
          className="rounded-xl border border-[var(--border-strong)] overflow-hidden"
          style={{ background: 'var(--code-bg)' }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <span className="text-xs text-white/40 font-mono">SKILL.md</span>
            <div className="flex items-center gap-2">
              <CopyButton
                text={SKILL_EXCERPT}
                label="Copy"
                className="!border-white/20 !text-white/50 hover:!text-white/80 hover:!border-white/40"
              />
              <a
                href={SKILL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border
                  border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 transition-colors"
                aria-label="Open raw SKILL.md"
              >
                <ExternalLink size={13} /> Open raw
              </a>
            </div>
          </div>
          <pre
            className="font-mono text-xs text-[var(--code-fg)]/80 p-5 max-h-80 overflow-y-auto thin-scroll
              leading-relaxed whitespace-pre-wrap break-words"
          >
            {SKILL_EXCERPT}
          </pre>
        </div>
        <p className="text-xs text-[var(--subtle)] mt-3 text-center">
          Full version at{' '}
          <a href={SKILL_RAW_URL} target="_blank" rel="noopener noreferrer"
            className="underline hover:text-[var(--ink)] transition-colors">
            github.com/bigjoe-io/aider
          </a>
        </p>
      </InView>
    </section>
  );
}
