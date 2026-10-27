import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, P, UL } from '../components/PageHeader';
import { Callout } from '../components/Callout';
import { CodeBlock, Code } from '../components/CodeBlock';

const HEADINGS = [
  { id: 'install', text: 'Install aidr', level: 2 },
  { id: 'init', text: 'aidr init', level: 2 },
  { id: 'balance', text: 'aidr balance', level: 2 },
  { id: 'first-payment', text: 'First payment', level: 2 },
  { id: 'reading-json', text: 'Reading the JSON result', level: 2 },
];

export function QuickstartAgents() {
  return (
    <DocLayout slug="quickstart-agents" headings={HEADINGS}>
      <PageHeader
        title="Quickstart for agents"
        summary="Install aidr, configure it, and make your first payment."
      />

      <Callout kind="warning">
        Never share your private key. It is stored in <Code>~/.leash/key</Code> with mode 600 and
        never printed or logged by the CLI. If it is compromised, the owner can revoke it instantly.
      </Callout>

      <H2 id="install">Install aidr</H2>
      <P>
        The CLI is in the <Code>cli/</Code> directory of the Aider repository. Install and build it:
      </P>
      <CodeBlock language="bash">
{`git clone https://github.com/bigjoe-io/aider
cd aider/cli
bun install
bun run build

# Optional: add to PATH
export PATH="$PWD/dist:$PATH"
# Or run directly:
node dist/index.js --help`}
      </CodeBlock>

      <H2 id="init">aidr init</H2>
      <P>
        The owner gives you two things: a wallet ID and your private key. Run <Code>aidr init</Code> once
        to save them:
      </P>
      <CodeBlock language="bash">
{`node dist/index.js init --wallet 1 --key 0xYOUR_PRIVATE_KEY`}
      </CodeBlock>
      <P>
        This saves the configuration to <Code>~/.leash/config.json</Code> and the key to{' '}
        <Code>~/.leash/key</Code>, both with mode 600. The key is never echoed back.
      </P>
      <CodeBlock tabs={[
        { label: 'JSON output', content: `{
  "status": "configured",
  "walletId": "1",
  "agentAddress": "0xYOUR_AGENT_ADDRESS",
  "contractAddress": "0xed32e15d81e7864bf19caea4333bd0781f328ba3",
  "network": "Arc Testnet",
  "configSaved": "~/.leash/config.json (mode 600)",
  "keySaved": "~/.leash/key (mode 600, never printed)"
}` },
        { label: 'Human output', content: `Configured. Agent 0xYOUR_AGENT_ADDRESS on wallet #1. Key stored at ~/.leash/key.` },
      ]} />
      <P>Use <Code>--mainnet</Code> to target Arc Mainnet instead of Arc Testnet.</P>

      <H2 id="balance">aidr balance</H2>
      <P>Always check your balance before paying. This tells you what you can spend right now.</P>
      <CodeBlock language="bash">
{`node dist/index.js balance`}
      </CodeBlock>
      <CodeBlock tabs={[
        { label: 'JSON output', content: `{
  "wallet": {
    "id": "1",
    "balance": "$10.00",
    "reserved": "$0.00",
    "available": "$10.00",
    "paused": false
  },
  "agent": {
    "address": "0xYOUR_AGENT_ADDRESS",
    "label": "Claude Code",
    "active": true,
    "perPaymentLimit": "$0.10",
    "dailyLimit": "$0.50",
    "spentToday": "$0.00",
    "remainingToday": "$0.50",
    "expiresAt": "never"
  }
}` },
        { label: 'Human output', content: `Available: $10.00  |  Daily: $0.00 / $0.50 (0% used)` },
      ]} />
      <P>Key fields to check before paying:</P>
      <UL>
        <li><Code>wallet.paused</Code> — if <Code>true</Code>, all payments are blocked. Stop.</li>
        <li><Code>agent.active</Code> — if <Code>false</Code>, you have been revoked. Stop.</li>
        <li><Code>agent.remainingToday</Code> — must be ≥ payment amount for a direct payment.</li>
        <li><Code>agent.perPaymentLimit</Code> — single payment must not exceed this.</li>
      </UL>

      <H2 id="first-payment">First payment</H2>
      <CodeBlock language="bash">
{`node dist/index.js pay 0xRECIPIENT_ADDRESS 0.05 "API credits for run #1"`}
      </CodeBlock>
      <P>
        If the amount is within your limits, it executes immediately. If you are over a limit,{' '}
        <Code>aidr pay</Code> automatically creates an approval request (30-minute TTL) and returns a
        request ID. The owner must approve it before funds are sent.
      </P>

      <H2 id="reading-json">Reading the JSON result</H2>
      <P>A successful direct payment:</P>
      <CodeBlock tabs={[
        { label: 'JSON output', content: `{
  "status": "paid",
  "txHash": "0x...",
  "explorer": "https://explorer.testnet.arc.io/tx/0x...",
  "to": "0xRECIPIENT",
  "amount": "$0.05",
  "memo": "API credits for run #1",
  "gasUsed": "98432"
}` },
      ]} />
      <P>An over-limit payment that created an approval request:</P>
      <CodeBlock tabs={[
        { label: 'JSON output', content: `{
  "status": "pending_approval",
  "requestId": "3",
  "txHash": "0x...",
  "explorer": "https://explorer.testnet.arc.io/tx/0x...",
  "to": "0xRECIPIENT",
  "amount": "$1.00",
  "memo": "premium dataset",
  "expiresAt": "2026-10-26T12:34:00.000Z"
}` },
      ]} />
      <P>Always check <Code>status</Code> first. Anything other than <Code>"paid"</Code> means the
      payment has not gone through yet.</P>
    </DocLayout>
  );
}
