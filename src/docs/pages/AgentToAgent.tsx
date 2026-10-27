import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, P, UL } from '../components/PageHeader';
import { Callout } from '../components/Callout';
import { CodeBlock, Code } from '../components/CodeBlock';

const HEADINGS = [
  { id: 'how-it-works', text: 'How it works', level: 2 },
  { id: 'example', text: 'Example', level: 2 },
  { id: 'receiving-agent', text: 'The receiving agent', level: 2 },
];

export function AgentToAgent() {
  return (
    <DocLayout slug="agent-to-agent" headings={HEADINGS}>
      <PageHeader
        title="Agent-to-agent payments"
        summary="One agent paying another agent's wallet directly."
      />

      <H2 id="how-it-works">How it works</H2>
      <P>
        From the contract's point of view, every payment goes to an Ethereum address. That address
        can be a human's wallet, a smart contract, or another agent's address — the contract does
        not distinguish.
      </P>
      <P>
        To pay another agent, you pass the agent's Ethereum address as the <Code>to</Code> parameter.
        The USDC transfers directly to that address. If the receiving agent has their own Aider wallet,
        their owner can deposit that received USDC into it — but that is a separate step.
      </P>

      <Callout kind="note">
        There is no built-in notion of "wallet-to-wallet" payments in Aider. Payments go to an
        Ethereum address. What the recipient does with those funds is outside the contract's scope.
      </Callout>

      <H2 id="example">Example</H2>
      <P>
        Agent A (a planning agent) needs to delegate a summarisation job to Agent B (a summarisation
        agent). Agent B charges 0.08 USDC per job.
      </P>
      <CodeBlock language="bash">
{`# Agent A runs this (with its own private key and wallet config)
node dist/index.js pay 0xAGENT_B_ADDRESS 0.08 "Summarisation job for task #42"`}
      </CodeBlock>
      <CodeBlock tabs={[
        { label: 'JSON output', content: `{
  "status": "paid",
  "txHash": "0x...",
  "explorer": "https://explorer.testnet.arc.io/tx/0x...",
  "to": "0xAGENT_B_ADDRESS",
  "amount": "$0.08",
  "memo": "Summarisation job for task #42",
  "gasUsed": "94210"
}` },
      ]} />
      <P>
        The 0.08 USDC lands in Agent B's wallet (their regular EOA). Agent B can confirm receipt
        by checking their USDC balance, or by checking the <Code>AgentPaid</Code> event on the explorer.
      </P>

      <H2 id="receiving-agent">The receiving agent</H2>
      <UL>
        <li>The recipient address does not need to be an Aider agent — it just needs to be a valid Ethereum address.</li>
        <li>There is no automatic forwarding into an Aider wallet. The receiving agent's owner deposits separately.</li>
        <li>If Agent B's address is on the paying wallet's blocklist, the payment will revert. Make sure to add Agent B to the allowlist if the wallet is in ALLOWLIST mode.</li>
      </UL>
    </DocLayout>
  );
}
