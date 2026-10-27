import { InView } from './InView';

const CARDS = [
  { title: 'Spending limits',        body: 'Per-payment and daily caps, set independently per agent.' },
  { title: 'Approval requests',      body: 'Over-limit payments wait for you with funds reserved onchain.' },
  { title: 'Instant revoke',         body: 'Cut off an agent in one transaction. Takes effect immediately.' },
  { title: 'Pause everything',       body: 'One switch stops every agent on the wallet at once.' },
  { title: 'Recipient rules',        body: 'Allow any recipient, or lock your agent to an approved list.' },
  { title: 'Agent-to-agent',         body: 'Agents can pay other agents directly — no owner step needed.' },
  { title: 'Leaked-key safety',      body: 'A stolen agent key can only spend within its own limits.' },
  { title: 'Built for agents',       body: 'JSON-first CLI and a SKILL.md any coding agent can follow.' },
];

export function Capabilities() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <InView>
        <h2
          className="font-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-10 text-center"
          style={{ letterSpacing: '-0.02em' }}
        >
          What Aider enforces
        </h2>
      </InView>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ title, body }, i) => (
          <InView key={title} delay={i * 40}>
            <div className="h-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="font-semibold text-[var(--ink)] mb-2 text-sm">{title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{body}</p>
            </div>
          </InView>
        ))}
      </div>
    </section>
  );
}
