import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, H3, P, UL } from '../components/PageHeader';
import { Callout } from '../components/Callout';
import { Code } from '../components/CodeBlock';

const HEADINGS = [
  { id: 'the-problem', text: 'The problem', level: 2 },
  { id: 'what-aider-does', text: 'What Aider does', level: 2 },
  { id: 'who-is-it-for', text: 'Who is it for', level: 2 },
  { id: 'what-it-is-not', text: 'What it is not', level: 2 },
];

export function Introduction() {
  return (
    <DocLayout slug="introduction" headings={HEADINGS}>
      <PageHeader
        title="Introduction"
        summary="What Aider is, who it is for, and the problem it solves."
      />

      <Callout kind="warning">
        Aider is unaudited and experimental. Use small amounts while testing.
      </Callout>

      <H2 id="the-problem">The problem</H2>
      <P>
        AI agents increasingly need to spend money: they pay for API calls, buy credits, hire
        sub-agents, and transfer between services. The naive solution is to give the agent a wallet
        with funds in it — but that hands the agent (and anyone who compromises it) full control over
        everything in that wallet.
      </P>
      <P>
        You need something in between: a way for the agent to spend autonomously on small things, while
        you retain control over anything larger, and can cut off access immediately if something goes wrong.
      </P>

      <H2 id="what-aider-does">What Aider does</H2>
      <P>
        Aider is a smart contract on Arc. You (the owner) deposit USDC into an Aider wallet and grant
        agents access with explicit limits:
      </P>
      <UL>
        <li><strong>Per-payment limit</strong> — the most an agent can spend in a single transaction.</li>
        <li><strong>Daily limit</strong> — the most an agent can spend per UTC day.</li>
        <li><strong>Expiry</strong> — the key stops working after a date you set.</li>
        <li><strong>Recipient rules</strong> — allow any recipient, or restrict to an approved list.</li>
      </UL>
      <P>
        When a payment is within limits, it executes immediately. When it exceeds a limit, the agent
        creates an approval request and the funds are reserved until you approve or reject it.
        You can revoke an agent in one transaction — instantly and permanently.
      </P>

      <H2 id="who-is-it-for">Who is it for</H2>
      <H3 id="for-owners">Owners</H3>
      <P>
        Developers or teams running AI agents who want to give agents budget without giving them full
        wallet access. You interact with Aider through the web app or directly through the contract.
      </P>
      <H3 id="for-agents">Agents</H3>
      <P>
        AI coding agents (Claude Code, custom scripts, LLM-driven pipelines) that need to make
        payments as part of their work. Agents interact through the <Code>aidr</Code> CLI, which
        outputs JSON and handles limit errors gracefully.
      </P>

      <H2 id="what-it-is-not">What it is not</H2>
      <UL>
        <li>Not a custodial service. Your funds live in the contract; only you can withdraw them.</li>
        <li>Not a bank or a payment processor. It is a smart contract on a public blockchain.</li>
        <li>Not production-ready. This is an experiment. Do not use it for large amounts.</li>
      </UL>
    </DocLayout>
  );
}
