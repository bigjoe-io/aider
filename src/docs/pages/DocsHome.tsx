import { Link } from 'react-router-dom';
import { DocLayout } from '../components/DocLayout';
import { Callout } from '../components/Callout';
import { Code } from '../components/CodeBlock';

const CARDS = [
  { to: '/docs/quickstart-owners', title: 'Quickstart for owners', body: 'Create a wallet, deposit USDC, and add an agent in under 5 minutes.' },
  { to: '/docs/quickstart-agents', title: 'Quickstart for agents', body: 'Install aidr, configure it, and make your first payment.' },
  { to: '/docs/how-it-works',      title: 'How it works',          body: 'The contract, where funds live, and the life of a payment.' },
  { to: '/docs/cli-reference',     title: 'CLI reference',         body: 'Every aidr command, flag, and JSON output shape.' },
];

export function DocsHome() {
  return (
    <DocLayout slug="">
      <div className="mb-6">
        <Callout kind="note">
          AI agents: read{' '}
          <a href="/llms.txt" className="underline hover:text-[var(--ink)]">/llms.txt</a>
          {' '}for an index of every page, or{' '}
          <a href="/llms-full.txt" className="underline hover:text-[var(--ink)]">/llms-full.txt</a>
          {' '}for all pages in one file. The raw SKILL.md is at{' '}
          <a href="/skill.md" className="underline hover:text-[var(--ink)]">/skill.md</a>.
        </Callout>
      </div>

      <div className="mb-8 pb-6 border-b border-[var(--border)]">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--ink)] mb-3" style={{ letterSpacing: '-0.02em' }}>
          Aider documentation
        </h1>
        <p className="text-[var(--muted)] text-lg leading-relaxed max-w-2xl">
          USDC wallets for AI agents on Arc — spending limits, approval flows, and instant revoke.
          All rules are enforced by a smart contract; no server required.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {CARDS.map(({ to, title, body }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col gap-2 p-5 rounded-xl border border-[var(--border)]
              hover:border-[var(--border-strong)] bg-[var(--surface)] transition-colors"
          >
            <h2 className="font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
              {title}
            </h2>
            <p className="text-sm text-[var(--muted)]">{body}</p>
          </Link>
        ))}
      </div>

      <div className="prose-section">
        <h2 className="font-display text-xl font-bold text-[var(--ink)] mb-3">What is Aider?</h2>
        <p className="text-[var(--ink-2)] leading-relaxed mb-3">
          Aider is a smart contract on Arc that lets a human owner create USDC wallets and grant AI
          agents scoped access to spend from them. Each agent gets its own key and its own spending rules.
          Small payments execute immediately; larger ones create an approval request that the owner
          approves or rejects. Agents can be revoked in a single transaction.
        </p>
        <p className="text-[var(--ink-2)] leading-relaxed mb-3">
          The <Code>aidr</Code> CLI is what agents actually run. It wraps the contract in a
          JSON-first command-line interface, handles limit errors gracefully, and stores the agent
          key securely at <Code>~/.leash/</Code> with mode 600.
        </p>
      </div>
    </DocLayout>
  );
}
