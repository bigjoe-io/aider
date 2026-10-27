import { InView } from './InView';

const RULES = [
  { rule: 'perPaymentLimit', type: 'USDC',          def: '0.10',    what: 'Max an agent can pay in one go without approval' },
  { rule: 'dailyLimit',      type: 'USDC',          def: '0.50',    what: 'Max an agent can spend per UTC day without approval' },
  { rule: 'expiresAt',       type: 'timestamp',     def: '30 days', what: "The agent's key stops working after this" },
  { rule: 'recipientMode',   type: 'any / allowlist', def: 'any',   what: 'Who the agent may pay' },
  { rule: 'blocked',         type: 'address list',  def: 'none',    what: 'Recipients that can never be paid' },
  { rule: 'requestTTL',      type: 'seconds',       def: '1800',    what: 'How long an approval request stays open (30 min)' },
  { rule: 'paused',          type: 'boolean',       def: 'false',   what: 'Stops every agent on the wallet' },
];

export function RulesTable() {
  return (
    <section id="rules" className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <InView>
        <h2
          className="font-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-3 text-center"
          style={{ letterSpacing: '-0.02em' }}
        >
          Rules reference
        </h2>
        <p className="text-[var(--muted)] text-center mb-10 text-sm">
          Defaults from the CLI and contract. Owner can override any value per agent.
        </p>
      </InView>

      <InView delay={80}>
        <div className="w-full overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                {['Rule', 'Type', 'Default', 'What it does'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RULES.map(({ rule, type, def, what }, i) => (
                <tr
                  key={rule}
                  className={`border-b border-[var(--border)] last:border-0 ${
                    i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-muted)]'
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-[var(--ink)] text-xs">{rule}</td>
                  <td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap">{type}</td>
                  <td className="px-4 py-3 font-mono text-[var(--ink-2)] text-xs whitespace-nowrap">{def}</td>
                  <td className="px-4 py-3 text-[var(--muted)] leading-relaxed">{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InView>
    </section>
  );
}
