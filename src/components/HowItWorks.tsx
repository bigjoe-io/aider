import { InView } from './InView';

const STEPS = [
  { n: '1', title: 'Fund your wallet with USDC on Arc.' },
  { n: '2', title: "Give your agent its own key, with limits." },
  { n: '3', title: 'Your agent pays for what it needs. You approve anything bigger.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <InView>
        <h2
          className="font-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-12 text-center"
          style={{ letterSpacing: '-0.02em' }}
        >
          How it works
        </h2>
      </InView>
      <div className="flex flex-col sm:flex-row gap-8">
        {STEPS.map(({ n, title }, i) => (
          <InView key={n} delay={i * 80} className="flex-1">
            <div className="flex flex-col gap-3">
              <span
                className="font-mono text-4xl font-bold text-[var(--border-strong)]"
                aria-hidden="true"
              >
                {n}
              </span>
              <p className="text-[var(--ink-2)] text-lg leading-snug">{title}</p>
            </div>
          </InView>
        ))}
      </div>
    </section>
  );
}
