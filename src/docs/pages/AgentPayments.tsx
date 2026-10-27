import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, P } from '../components/PageHeader';
import { Callout } from '../components/Callout';
import { Code } from '../components/CodeBlock';
import { Table } from '../components/Table';

const HEADINGS = [
  { id: 'checks-in-order', text: 'Checks in order', level: 2 },
  { id: 'what-happens-on-success', text: 'On success', level: 2 },
  { id: 'daily-reset', text: 'Daily reset', level: 2 },
];

export function AgentPayments() {
  return (
    <DocLayout slug="agent-payments" headings={HEADINGS}>
      <PageHeader
        title="Agent payments"
        summary="What agentPay checks, in order, and what each failure means."
      />

      <H2 id="checks-in-order">Checks in order</H2>
      <P>
        When an agent calls <Code>agentPay(walletId, to, amount, memo)</Code>, the contract runs
        these checks in sequence. The first one that fails reverts the transaction with a specific error.
      </P>

      <Table
        headers={['#', 'Check', 'Fails with', 'What it means']}
        rows={[
          ['1', 'Wallet exists (owner ≠ zero address)', 'revert "WALLET_NOT_FOUND"', 'The wallet ID does not exist.'],
          ['2', 'Caller is known to the wallet (has been added as an agent)', <Code>AgentNotActive</Code>, 'The caller was never added as an agent.'],
          ['3', <>Caller's <Code>active</Code> flag is true</>, <Code>AgentRevokedError</Code>, 'The owner called revokeAgent.'],
          ['4', <>Agent's <Code>expiresAt</Code> is 0 or in the future</>, <Code>AgentExpired</Code>, 'The agent key has passed its expiry timestamp.'],
          ['5', <>Wallet's <Code>paused</Code> flag is false</>, <Code>WalletPaused</Code>, 'The owner paused the wallet. All agent payments are blocked.'],
          ['6', <><Code>to</Code> is not the zero address</>, <Code>ZeroAddress</Code>, 'Invalid recipient address.'],
          ['7', <><Code>amount</Code> is greater than zero</>, <Code>ZeroAmount</Code>, 'Amount must be positive.'],
          ['8', <>Recipient is not on the blocklist</>, <Code>RecipientBlocked</Code>, 'The owner has explicitly blocked this recipient.'],
          ['9', <>If wallet mode is ALLOWLIST: recipient is on the allowlist</>, <Code>RecipientNotAllowed</Code>, 'Wallet is in allowlist-only mode and this address is not on the list.'],
          ['10', <><Code>amount ≤ agent.perPaymentLimit</Code></>, <Code>OverPerPaymentLimit</Code>, 'This payment exceeds the per-payment cap.'],
          ['11', <>(Daily reset runs here, then) <Code>spentToday + amount ≤ dailyLimit</Code></>, <Code>OverDailyLimit</Code>, 'Adding this payment would exceed the agent\'s daily budget.'],
          ['12', <><Code>balance − reserved ≥ amount</Code></>, <Code>InsufficientBalance</Code>, 'The wallet does not have enough unreserved USDC.'],
        ]}
      />

      <Callout kind="note">
        Checks 2–4 (agent existence and status) run before the pause check (5). A revoked agent
        on a paused wallet gets <Code>AgentRevokedError</Code>, not <Code>WalletPaused</Code>.
      </Callout>

      <H2 id="what-happens-on-success">On success</H2>
      <P>When all checks pass, the contract:</P>
      <ol className="list-decimal pl-5 space-y-1.5 text-[var(--ink-2)] text-sm mb-4">
        <li>Adds <Code>amount</Code> to <Code>agent.spentToday</Code>.</li>
        <li>Subtracts <Code>amount</Code> from <Code>wallet.balance</Code>.</li>
        <li>Calls <Code>IERC20.transfer(to, amount)</Code> — USDC goes directly to the recipient.</li>
        <li>Emits <Code>AgentPaid(walletId, agent, to, amount, memo)</Code>.</li>
      </ol>
      <P>
        State changes happen before the token transfer (checks-effects-interactions pattern), and
        the function is protected by a reentrancy guard.
      </P>

      <H2 id="daily-reset">Daily reset</H2>
      <P>
        Step 11 first calls an internal <Code>_refreshDailySpend</Code> helper. If the current day
        (UTC midnight floor of <Code>block.timestamp</Code>) is later than the agent's stored{' '}
        <Code>dayStart</Code>, it resets <Code>spentToday</Code> to zero and updates{' '}
        <Code>dayStart</Code>. This means the first payment of each new day always starts from
        a clean slate, regardless of how much was spent the day before.
      </P>
    </DocLayout>
  );
}
