import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, P } from '../components/PageHeader';
import { Code } from '../components/CodeBlock';
import { Table } from '../components/Table';
import { Callout } from '../components/Callout';

const HEADINGS = [
  { id: 'agent-rules', text: 'Agent rules', level: 2 },
  { id: 'wallet-rules', text: 'Wallet rules', level: 2 },
  { id: 'changing-rules', text: 'Changing rules', level: 2 },
];

export function SpendingRules() {
  return (
    <DocLayout slug="spending-rules" headings={HEADINGS}>
      <PageHeader
        title="Spending rules"
        summary="Every rule — type, default, example, and how to change it."
      />

      <Callout kind="note">
        All USDC amounts are stored and passed in 6-decimal units. 1 USDC = 1,000,000 (1e6).
        The CLI formats them as dollar strings; the contract stores raw integers.
      </Callout>

      <H2 id="agent-rules">Agent rules</H2>
      <P>Set per agent via <Code>addAgent</Code> and changed via <Code>updateAgent</Code>. Only the wallet owner can change them.</P>
      <Table
        headers={['Rule', 'Type', 'Units', 'Example value', 'What it controls']}
        rows={[
          [<Code>perPaymentLimit</Code>, 'uint256', 'USDC (6-dec)', '100000 (= $0.10)', 'Maximum amount for a single agentPay call. Payments over this must use requestPayment.'],
          [<Code>dailyLimit</Code>, 'uint256', 'USDC (6-dec)', '500000 (= $0.50)', 'Maximum total the agent can spend via agentPay in one UTC day. Resets at midnight UTC.'],
          [<Code>expiresAt</Code>, 'uint256', 'Unix timestamp', '1793164800', 'The agent key stops working after this timestamp. Set to 0 for no expiry.'],
          [<Code>label</Code>, 'string', '—', '"Claude Code"', 'Human-readable name. Not enforced onchain; for owner reference only.'],
        ]}
      />

      <H2 id="wallet-rules">Wallet rules</H2>
      <P>Set per wallet. Only the wallet owner can change them.</P>
      <Table
        headers={['Rule', 'Type', 'Default', 'What it controls']}
        rows={[
          [<Code>paused</Code>, 'bool', 'false', 'When true, all agentPay and requestPayment calls on this wallet revert with WalletPaused, for every agent.'],
          [<Code>recipientMode</Code>, 'RecipientMode', 'ANY', 'ANY: agents can pay any non-blocked address. ALLOWLIST: agents can only pay addresses on the allowlist.'],
          ['allowlist', 'mapping(address → bool)', 'empty', 'In ALLOWLIST mode, only these addresses can be paid. Managed with setAllowlist().'],
          ['blocklist', 'mapping(address → bool)', 'empty', 'These addresses can never be paid by any agent, regardless of mode. Managed with setBlocklist().'],
        ]}
      />

      <H2 id="changing-rules">Changing rules</H2>
      <P>All rule changes require a transaction from the wallet owner's address:</P>
      <Table
        headers={['What to change', 'Function', 'Who can call']}
        rows={[
          ['Agent limits (perPaymentLimit, dailyLimit, expiresAt)', <Code>updateAgent(walletId, agentAddress, perPaymentLimit, dailyLimit, expiresAt)</Code>, 'Owner'],
          ['Pause / unpause wallet', <Code>pauseWallet(walletId, bool)</Code>, 'Owner'],
          ['Recipient mode', <Code>setRecipientMode(walletId, mode)</Code>, 'Owner (0 = ANY, 1 = ALLOWLIST)'],
          ['Allowlist entry', <Code>setAllowlist(walletId, address, bool)</Code>, 'Owner'],
          ['Blocklist entry', <Code>setBlocklist(walletId, address, bool)</Code>, 'Owner'],
        ]}
      />

      <Callout kind="tip">
        Changes take effect immediately on the next transaction — there is no delay or timelock.
        Lowering a limit or adding a blocklist entry is instant.
      </Callout>
    </DocLayout>
  );
}
