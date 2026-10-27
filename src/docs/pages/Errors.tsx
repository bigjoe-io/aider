import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, P } from '../components/PageHeader';
import { Code } from '../components/CodeBlock';
import { Table } from '../components/Table';

const HEADINGS = [
  { id: 'contract-errors', text: 'Contract errors', level: 2 },
  { id: 'require-errors', text: 'Require strings', level: 2 },
];

export function Errors() {
  return (
    <DocLayout slug="errors" headings={HEADINGS}>
      <PageHeader
        title="Errors"
        summary="Every contract error, the CLI message, and what to do."
      />

      <H2 id="contract-errors">Contract errors</H2>
      <P>
        These are Solidity custom errors. The CLI decodes them from the revert data and surfaces
        them in the JSON output's <Code>error</Code> field, with a <Code>message</Code> and{' '}
        <Code>hint</Code>.
      </P>
      <Table
        headers={['Error', '4-byte selector', 'CLI message', 'What to do']}
        rows={[
          [<Code>WalletPaused</Code>, '0x3c1bfd9e', 'The wallet is paused.', 'Contact the wallet owner to call pauseWallet(id, false).'],
          [<Code>AgentNotActive</Code>, '0x29c9d28e', '(pre-flight: agent is not active)', 'Your address was never added as an agent, or was removed. Contact the owner.'],
          [<Code>AgentRevokedError</Code>, '0x3d4fa12a', 'This agent has been revoked.', 'The owner called revokeAgent. Ask them to re-add you with addAgent.'],
          [<Code>AgentExpired</Code>, '0x8af8ae35', 'This agent key expired at <ISO date>.', 'Ask the owner to call updateAgent with a later expiresAt.'],
          [<Code>RecipientNotAllowed</Code>, '0x6c7bcc15', 'Recipient is not on the allowlist.', 'Ask the owner to call setAllowlist(walletId, recipientAddress, true), or switch the wallet to ANY mode.'],
          [<Code>RecipientBlocked</Code>, '0x55b6cf7f', 'Recipient is on the blocklist.', 'Ask the owner to call setBlocklist(walletId, recipientAddress, false).'],
          [<Code>OverPerPaymentLimit</Code>, '0x53c98e2e', 'Over your per-payment limit ($X). This payment: $Y.', 'The CLI automatically falls back to requestPayment. Otherwise, ask the owner to raise perPaymentLimit via updateAgent.'],
          [<Code>OverDailyLimit</Code>, '0x1f2a2005', 'Over your daily limit ($X). Spent today: $Y. Remaining: $Z.', 'The CLI automatically falls back to requestPayment. Otherwise, wait for UTC midnight reset, or ask owner to raise dailyLimit.'],
          [<Code>InsufficientBalance</Code>, '0xf4d678b8', 'Insufficient wallet balance. Available: $X, requested: $Y.', 'The CLI falls back to requestPayment. Ask the owner to deposit more USDC.'],
          [<Code>RequestNotPending</Code>, 'n/a', '(contract only)', 'The request is not in PENDING state. Check its current status with aidr status <id>.'],
          [<Code>RequestExpiredError</Code>, 'n/a', '(contract only)', 'The TTL has passed. The owner cannot approve an expired request.'],
          [<Code>RequestNotExpiredYet</Code>, 'n/a', '(contract only)', 'Tried to call expireRequest before the TTL passed. Wait and try again.'],
          [<Code>ZeroAmount</Code>, 'n/a', '(contract only)', 'Amount must be greater than zero. The CLI validates this before sending.'],
          [<Code>ZeroAddress</Code>, 'n/a', '(contract only)', 'Address must not be the zero address. The CLI validates this before sending.'],
          [<Code>InvalidTTL</Code>, 'n/a', '(contract only)', 'TTL for requestPayment must be > 0. The CLI hardcodes 1800 seconds.'],
          [<Code>NotWalletOwner</Code>, 'n/a', '(contract only)', 'Only the wallet owner can call this function.'],
        ]}
        compact
      />

      <H2 id="require-errors">Require strings</H2>
      <P>
        Two error conditions use <Code>require()</Code> strings rather than custom errors:
      </P>
      <Table
        headers={['String', 'When', 'What to do']}
        rows={[
          ['"WALLET_NOT_FOUND"', 'Wallet ID does not exist in the contract.', 'Check the wallet ID in your config. Run aidr init again if needed.'],
          ['"USDC_TRANSFER_FAILED"', 'The USDC ERC-20 transfer returned false.', 'Should not occur under normal conditions. Check if the contract is well-funded.'],
          ['"USDC_TRANSFER_FROM_FAILED"', 'The USDC transferFrom during deposit returned false.', 'Check that you approved the contract for the deposit amount before calling deposit().'],
        ]}
        compact
      />
    </DocLayout>
  );
}
