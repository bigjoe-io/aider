import { Check, X } from 'lucide-react';
import { InView } from './InView';

const CAN = [
  'Spend up to its per-payment and daily limits',
  'Request approval for larger payments (you see them)',
];

const CANNOT = [
  'Withdraw your funds from the wallet',
  'Change its own limits or expiry',
  'Approve its own payment requests',
  'Add new agents or change recipient rules',
  'Spend a single cent after you revoke it',
];

export function Security() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <InView>
        <h2
          className="font-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-3 text-center"
          style={{ letterSpacing: '-0.02em' }}
        >
          If an agent key leaks
        </h2>
        <p className="text-[var(--muted)] text-center mb-10 text-sm">
          Onchain rules, not app-layer policies.
        </p>
      </InView>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <InView delay={0}>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="font-semibold text-[var(--ink)] mb-4 text-sm uppercase tracking-wider">
              A leaked key CAN
            </h3>
            <ul className="space-y-3">
              {CAN.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-[var(--ink-2)]">
                  <Check size={15} className="mt-0.5 shrink-0 text-[var(--warning)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </InView>

        <InView delay={80}>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="font-semibold text-[var(--ink)] mb-4 text-sm uppercase tracking-wider">
              A leaked key CAN'T
            </h3>
            <ul className="space-y-3">
              {CANNOT.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-[var(--ink-2)]">
                  <X size={15} className="mt-0.5 shrink-0 text-[var(--success)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </InView>
      </div>
    </section>
  );
}
