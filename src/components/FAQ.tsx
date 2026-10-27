import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { InView } from './InView';

const ITEMS = [
  {
    q: 'Who holds the money?',
    a: 'Your Aider wallet contract on Arc. The contract is non-custodial — only you (the owner address) can withdraw funds. Aider has no access.',
  },
  {
    q: 'What does it run on?',
    a: 'Arc mainnet. Arc is an EVM-compatible chain where USDC is the native gas token, so payments and gas are both in USDC.',
  },
  {
    q: 'Which agents can use it?',
    a: 'Anything that can run a terminal command: Claude Code, OpenAI Codex, custom Python or Node agents, shell scripts. If it can run `aidr pay`, it works.',
  },
  {
    q: 'Is it audited?',
    a: "No. Aider is an experiment built for Arc Microgrants. The contract has had an automated security review but not a professional audit. Use small amounts.",
  },
  {
    q: 'What happens if my agent goes rogue?',
    a: 'It hits its per-payment and daily limits, its large payments wait for your approval, and you can revoke it in one transaction. The worst case is the agent spends its daily budget before you notice.',
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left
          text-[var(--ink)] font-medium text-sm sm:text-base
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          size={18}
          className="shrink-0 text-[var(--muted)] transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm text-[var(--muted)] leading-relaxed max-w-prose">
          {a}
        </p>
      )}
    </div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <InView>
        <h2
          className="font-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-10 text-center"
          style={{ letterSpacing: '-0.02em' }}
        >
          FAQ
        </h2>
      </InView>
      <InView delay={60}>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 sm:px-7 divide-y-0">
          {ITEMS.map((item) => (
            <Item key={item.q} {...item} />
          ))}
        </div>
      </InView>
    </section>
  );
}
