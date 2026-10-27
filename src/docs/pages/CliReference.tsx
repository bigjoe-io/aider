import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, H3, P } from '../components/PageHeader';
import { CodeBlock, Code } from '../components/CodeBlock';
import { Callout } from '../components/Callout';
import { Table } from '../components/Table';

const HEADINGS = [
  { id: 'overview', text: 'Overview', level: 2 },
  { id: 'init', text: 'aidr init', level: 2 },
  { id: 'balance', text: 'aidr balance', level: 2 },
  { id: 'pay', text: 'aidr pay', level: 2 },
  { id: 'status', text: 'aidr status', level: 2 },
  { id: 'wait', text: 'aidr wait', level: 2 },
  { id: 'history', text: 'aidr history', level: 2 },
];

export function CliReference() {
  return (
    <DocLayout slug="cli-reference" headings={HEADINGS}>
      <PageHeader
        title="CLI reference"
        summary="Every aidr command: usage, flags, and JSON output."
      />

      <H2 id="overview">Overview</H2>
      <P>
        The CLI binary is <Code>node dist/index.js</Code> from the built CLI package in <Code>cli/</Code>.
        Every command writes JSON to stdout and a human-readable summary to stderr (or stdout for
        success messages). Exit code 0 = success, 1 = error.
      </P>
      <CodeBlock language="bash">
{`node dist/index.js --help`}
      </CodeBlock>

      {/* ── init ─────────────────────────────────────────────────────────── */}
      <H2 id="init">aidr init</H2>
      <P>Configure the CLI for an agent. Saves the wallet ID and private key to <Code>~/.leash/</Code>.</P>
      <CodeBlock language="bash">
{`node dist/index.js init --wallet <walletId> --key <privateKey> [--contract <address>] [--mainnet]`}
      </CodeBlock>
      <Table
        headers={['Flag', 'Required', 'Default', 'Description']}
        rows={[
          ['--wallet <id>', 'Yes', '—', 'The numeric Aider wallet ID to use.'],
          ['--key <hex>', 'Yes', '—', 'The agent\'s private key (32-byte hex, with or without 0x prefix).'],
          ['--contract <addr>', 'No', '0xed32e15d81e7864bf19caea4333bd0781f328ba3', 'Override the contract address (for custom deployments).'],
          ['--mainnet', 'No', 'false (Arc Testnet)', 'Target Arc Mainnet instead of Testnet.'],
        ]}
        compact
      />
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
      ]} />

      {/* ── balance ──────────────────────────────────────────────────────── */}
      <H2 id="balance">aidr balance</H2>
      <P>Show the current wallet balance and this agent's spending state.</P>
      <CodeBlock language="bash">
{`node dist/index.js balance`}
      </CodeBlock>
      <P>No flags.</P>
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
      ]} />
      <P>
        <Code>expiresAt</Code> is <Code>"never"</Code> when the agent has no expiry, an ISO 8601
        timestamp when it has one, or a string prefixed with <Code>"EXPIRED"</Code> if it has passed.
      </P>

      {/* ── pay ──────────────────────────────────────────────────────────── */}
      <H2 id="pay">aidr pay</H2>
      <P>
        Send USDC to a recipient. If the direct payment fails due to a limit, automatically falls
        back to creating an approval request (unless <Code>--no-request</Code> is set).
      </P>
      <CodeBlock language="bash">
{`node dist/index.js pay <recipientAddress> <amount> <memo> [--no-request]`}
      </CodeBlock>
      <Table
        headers={['Argument / Flag', 'Required', 'Description']}
        rows={[
          ['recipientAddress', 'Yes', 'Ethereum address to send USDC to.'],
          ['amount', 'Yes', 'Amount in USDC, decimal format. Example: "0.05" or "1.50".'],
          ['memo', 'Yes', 'Non-empty string describing the payment. Stored in the event log.'],
          ['--no-request', 'No', 'Do not fall back to requestPayment on a limit error. Exit with code 1 instead.'],
        ]}
        compact
      />
      <H3 id="pay-success">Successful direct payment</H3>
      <CodeBlock tabs={[
        { label: 'JSON output', content: `{
  "status": "paid",
  "txHash": "0x...",
  "explorer": "https://explorer.testnet.arc.io/tx/0x...",
  "to": "0xRECIPIENT",
  "amount": "$0.05",
  "memo": "API credits",
  "gasUsed": "94210"
}` },
      ]} />
      <H3 id="pay-pending">Over-limit — approval request created</H3>
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
      <H3 id="pay-error">Error</H3>
      <CodeBlock tabs={[
        { label: 'JSON output', content: `{
  "status": "error",
  "error": "OverPerPaymentLimit",
  "message": "Over your per-payment limit ($0.10). This payment: $1.00.",
  "hint": "Remove --no-request to create an approval request instead."
}` },
      ]} />
      <P>
        Errors that trigger the automatic fallback to <Code>requestPayment</Code> (unless{' '}
        <Code>--no-request</Code>): <Code>OverPerPaymentLimit</Code>, <Code>OverDailyLimit</Code>,{' '}
        <Code>InsufficientBalance</Code>.
      </P>
      <P>
        Errors that always exit with code 1 (no fallback): <Code>WalletPaused</Code>,{' '}
        <Code>AgentRevoked</Code>, <Code>AgentExpired</Code>, <Code>RecipientBlocked</Code>,{' '}
        <Code>RecipientNotAllowed</Code>.
      </P>

      {/* ── status ───────────────────────────────────────────────────────── */}
      <H2 id="status">aidr status</H2>
      <P>Look up the current state of an approval request by its ID.</P>
      <CodeBlock language="bash">
{`node dist/index.js status <requestId>`}
      </CodeBlock>
      <CodeBlock tabs={[
        { label: 'JSON output', content: `{
  "requestId": "3",
  "status": "PENDING",
  "walletId": "1",
  "agent": "0xAGENT",
  "to": "0xRECIPIENT",
  "amount": "$1.00",
  "memo": "premium dataset",
  "expiresAt": "2026-10-26T12:34:00.000Z",
  "expired": false
}` },
      ]} />
      <P>
        <Code>status</Code> is one of <Code>"PENDING"</Code>, <Code>"APPROVED"</Code>,{' '}
        <Code>"REJECTED"</Code>, or <Code>"EXPIRED"</Code>. <Code>expired</Code> is <Code>true</Code>{' '}
        when the current time is past <Code>expiresAt</Code> and the status is still PENDING.
      </P>

      {/* ── wait ─────────────────────────────────────────────────────────── */}
      <H2 id="wait">aidr wait</H2>
      <P>
        Poll a request until it leaves PENDING state (approved, rejected, or expired). Useful in
        scripts that must block until the owner acts.
      </P>
      <CodeBlock language="bash">
{`node dist/index.js wait <requestId>`}
      </CodeBlock>
      <P>
        Polls every 5 seconds. When the request leaves PENDING state, outputs the final status as
        JSON (same shape as <Code>aidr status</Code>) and exits with code 0 for APPROVED, code 1
        for REJECTED or EXPIRED.
      </P>
      <Callout kind="note">
        <Code>aidr wait</Code> does not time out on its own. Use a shell timeout if you need
        a maximum wait: <Code>timeout 600 node dist/index.js wait 3</Code>
      </Callout>

      {/* ── history ──────────────────────────────────────────────────────── */}
      <H2 id="history">aidr history</H2>
      <P>
        Show the last 10,000 blocks of <Code>AgentPaid</Code> events for this agent on the configured wallet.
      </P>
      <CodeBlock language="bash">
{`node dist/index.js history`}
      </CodeBlock>
      <P>No flags. Results are sorted newest-first.</P>
      <CodeBlock tabs={[
        { label: 'JSON output (with payments)', content: `{
  "status": "ok",
  "count": 2,
  "total": "$0.13",
  "payments": [
    {
      "txHash": "0x...",
      "explorer": "https://explorer.testnet.arc.io/tx/0x...",
      "blockNumber": "12345",
      "walletId": "1",
      "agent": "0xAGENT",
      "to": "0xRECIPIENT",
      "toExplorer": "https://explorer.testnet.arc.io/address/0xRECIPIENT",
      "amount": "$0.08",
      "memo": "Summarisation job for task #42"
    },
    { "...": "..." }
  ]
}` },
        { label: 'JSON output (no payments)', content: `{
  "status": "ok",
  "payments": [],
  "count": 0
}` },
      ]} />
    </DocLayout>
  );
}
