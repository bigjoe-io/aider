import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, H3, P } from '../components/PageHeader';
import { Code } from '../components/CodeBlock';
import { Table } from '../components/Table';
import { Callout } from '../components/Callout';

const CONTRACT = '0xed32e15d81e7864bf19caea4333bd0781f328ba3';
const EXPLORER = 'https://explorer.testnet.arc.io';

const HEADINGS = [
  { id: 'deployment', text: 'Deployment', level: 2 },
  { id: 'state-mutating', text: 'State-mutating functions', level: 2 },
  { id: 'view-functions', text: 'View functions', level: 2 },
  { id: 'events', text: 'Events', level: 2 },
  { id: 'errors', text: 'Errors', level: 2 },
];

export function ContractReference() {
  return (
    <DocLayout slug="contract-reference" headings={HEADINGS}>
      <PageHeader
        title="Contract reference"
        summary="Every function, view, event, and error in the Aider contract."
      />

      <Callout kind="note">
        The contract source is at <Code>contracts/Leash.sol</Code> in the repository. The ABI is
        at <Code>contracts/out/Leash.sol/Leash.json</Code>.
      </Callout>

      <H2 id="deployment">Deployment</H2>
      <Table
        headers={['Field', 'Value']}
        rows={[
          ['Contract name', 'Leash'],
          ['Network', 'Arc Testnet'],
          ['Address', <a href={`${EXPLORER}/address/${CONTRACT}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs underline hover:text-[var(--ink)]">{CONTRACT}</a>],
          ['USDC token', <Code>0x3600000000000000000000000000000000000000</Code>],
          ['Solidity', '0.8.28'],
          ['EVM target', 'Cancun'],
          ['Upgradeable', 'No'],
          ['Admin', 'None (per-wallet ownership only)'],
        ]}
        compact
      />

      <H2 id="state-mutating">State-mutating functions</H2>

      <H3 id="createWallet">createWallet</H3>
      <P><Code>createWallet() returns (uint256 walletId)</Code></P>
      <P>Creates a new wallet owned by <Code>msg.sender</Code>. Returns the new wallet ID (starts at 1, increments globally). Anyone can call this.</P>

      <H3 id="deposit">deposit</H3>
      <P><Code>deposit(uint256 walletId, uint256 amount)</Code></P>
      <P>Transfers <Code>amount</Code> USDC from <Code>msg.sender</Code> to the contract and adds it to the wallet balance. Caller must have approved the contract for at least <Code>amount</Code> USDC. Only the wallet owner can call this.</P>
      <P>Errors: <Code>ZeroAmount</Code>, <Code>NotWalletOwner</Code>, <Code>"USDC_TRANSFER_FROM_FAILED"</Code></P>

      <H3 id="withdraw">withdraw</H3>
      <P><Code>withdraw(uint256 walletId, uint256 amount)</Code></P>
      <P>Transfers <Code>amount</Code> USDC from the wallet to <Code>msg.sender</Code>. Only unreserved funds can be withdrawn. Only the wallet owner can call this.</P>
      <P>Errors: <Code>ZeroAmount</Code>, <Code>NotWalletOwner</Code>, <Code>InsufficientBalance</Code></P>

      <H3 id="pauseWallet">pauseWallet</H3>
      <P><Code>pauseWallet(uint256 walletId, bool paused)</Code></P>
      <P>Sets the wallet's paused flag. When <Code>true</Code>, all <Code>agentPay</Code> and <Code>requestPayment</Code> calls revert. Only the wallet owner can call this.</P>

      <H3 id="addAgent">addAgent</H3>
      <P><Code>addAgent(uint256 walletId, address agentAddress, string label, uint256 perPaymentLimit, uint256 dailyLimit, uint256 expiresAt)</Code></P>
      <P>Adds an agent to the wallet. <Code>perPaymentLimit</Code> and <Code>dailyLimit</Code> are in 6-decimal USDC units. <Code>expiresAt</Code> is a Unix timestamp; use 0 for no expiry. Only the wallet owner can call this.</P>
      <P>Errors: <Code>ZeroAddress</Code>, <Code>NotWalletOwner</Code></P>

      <H3 id="updateAgent">updateAgent</H3>
      <P><Code>updateAgent(uint256 walletId, address agentAddress, uint256 perPaymentLimit, uint256 dailyLimit, uint256 expiresAt)</Code></P>
      <P>Updates the limits and expiry for an existing agent. The agent must have been previously added. Only the wallet owner can call this.</P>
      <P>Errors: <Code>ZeroAddress</Code>, <Code>NotWalletOwner</Code>, <Code>AgentNotActive</Code> (if never added)</P>

      <H3 id="revokeAgent">revokeAgent</H3>
      <P><Code>revokeAgent(uint256 walletId, address agentAddress)</Code></P>
      <P>Sets the agent's <Code>active</Code> flag to false. The agent can no longer call <Code>agentPay</Code> or <Code>requestPayment</Code>. Only the wallet owner can call this.</P>

      <H3 id="setRecipientMode">setRecipientMode</H3>
      <P><Code>setRecipientMode(uint256 walletId, RecipientMode mode)</Code></P>
      <P>Sets the wallet to ANY (0) or ALLOWLIST (1) mode. In ALLOWLIST mode, agents can only pay addresses that are on the allowlist. Only the wallet owner can call this.</P>

      <H3 id="setAllowlist">setAllowlist</H3>
      <P><Code>setAllowlist(uint256 walletId, address recipient, bool allowed)</Code></P>
      <P>Adds or removes a recipient from the allowlist. Only the wallet owner can call this.</P>

      <H3 id="setBlocklist">setBlocklist</H3>
      <P><Code>setBlocklist(uint256 walletId, address recipient, bool blocked)</Code></P>
      <P>Adds or removes a recipient from the blocklist. Blocked addresses can never receive payments from agents, regardless of mode. Only the wallet owner can call this.</P>

      <H3 id="agentPay">agentPay</H3>
      <P><Code>agentPay(uint256 walletId, address to, uint256 amount, string memo)</Code></P>
      <P>Makes an immediate USDC payment from the wallet to <Code>to</Code>. Called by the agent. See <a href="/docs/agent-payments" className="underline hover:text-[var(--ink)]">Agent payments</a> for the full check order.</P>
      <P>Errors: <Code>WalletPaused</Code>, <Code>AgentNotActive</Code>, <Code>AgentRevokedError</Code>, <Code>AgentExpired</Code>, <Code>ZeroAddress</Code>, <Code>ZeroAmount</Code>, <Code>RecipientBlocked</Code>, <Code>RecipientNotAllowed</Code>, <Code>OverPerPaymentLimit</Code>, <Code>OverDailyLimit</Code>, <Code>InsufficientBalance</Code></P>

      <H3 id="requestPayment">requestPayment</H3>
      <P><Code>requestPayment(uint256 walletId, address to, uint256 amount, string memo, uint256 ttlSeconds) returns (uint256 requestId)</Code></P>
      <P>Creates a pending approval request and reserves the funds. Called by the agent. Returns the request ID. TTL must be greater than zero.</P>
      <P>Errors: <Code>WalletPaused</Code>, <Code>AgentNotActive</Code>, <Code>AgentRevokedError</Code>, <Code>AgentExpired</Code>, <Code>ZeroAddress</Code>, <Code>ZeroAmount</Code>, <Code>InvalidTTL</Code>, <Code>RecipientBlocked</Code>, <Code>RecipientNotAllowed</Code>, <Code>InsufficientBalance</Code></P>

      <H3 id="approveRequest">approveRequest</H3>
      <P><Code>approveRequest(uint256 requestId)</Code></P>
      <P>Approves a pending request, sends the USDC, and releases the reservation. The request must be PENDING and not expired. Recipient is re-validated against current blocklist and allowlist. Only the wallet owner can call this.</P>
      <P>Errors: <Code>RequestNotPending</Code>, <Code>NotWalletOwner</Code>, <Code>RequestExpiredError</Code>, <Code>RecipientBlocked</Code>, <Code>RecipientNotAllowed</Code></P>

      <H3 id="rejectRequest">rejectRequest</H3>
      <P><Code>rejectRequest(uint256 requestId)</Code></P>
      <P>Rejects a pending request and releases the reservation. No funds are transferred. Only the wallet owner can call this.</P>
      <P>Errors: <Code>RequestNotPending</Code>, <Code>NotWalletOwner</Code></P>

      <H3 id="expireRequest">expireRequest</H3>
      <P><Code>expireRequest(uint256 requestId)</Code></P>
      <P>Moves a request to EXPIRED state and releases the reservation. Can be called by anyone, but only after the TTL has passed.</P>
      <P>Errors: <Code>RequestNotPending</Code>, <Code>RequestNotExpiredYet</Code></P>

      <H2 id="view-functions">View functions</H2>
      <Table
        headers={['Function', 'Returns', 'Description']}
        rows={[
          [<Code>getWallet(walletId)</Code>, '(owner, balance, reserved, available, paused, mode)', 'All fields for a wallet. available = balance − reserved.'],
          [<Code>getAgent(walletId, agentAddress)</Code>, '(label, perPaymentLimit, dailyLimit, expiresAt, active, spentToday, dayStart)', 'All fields for an agent.'],
          [<Code>getRequest(requestId)</Code>, 'PaymentRequest struct', 'All fields for a request.'],
          [<Code>getPendingRequests(walletId)</Code>, 'uint256[] pendingIds', 'Array of request IDs with PENDING status for a wallet. O(n) over all requests.'],
          [<Code>isAllowlisted(walletId, recipient)</Code>, 'bool', 'True if recipient is on the allowlist.'],
          [<Code>isBlocklisted(walletId, recipient)</Code>, 'bool', 'True if recipient is on the blocklist.'],
          [<Code>isRecipientPermitted(walletId, recipient)</Code>, 'bool', 'True if recipient can currently receive payments (combines blocklist and allowlist/mode check).'],
          [<Code>nextWalletId()</Code>, 'uint256', 'The ID that will be assigned to the next created wallet.'],
          [<Code>nextRequestId()</Code>, 'uint256', 'The ID that will be assigned to the next created request.'],
          [<Code>USDC_TOKEN()</Code>, 'address', 'The hardcoded USDC ERC-20 address: 0x3600000000000000000000000000000000000000'],
        ]}
      />

      <H2 id="events">Events</H2>
      <P>See the <a href="/docs/watching-activity" className="underline hover:text-[var(--ink)]">Watching activity</a> page for full event signatures and descriptions.</P>

      <H2 id="errors">Errors</H2>
      <P>See the <a href="/docs/errors" className="underline hover:text-[var(--ink)]">Errors</a> page for the full table of errors, selectors, and remediation steps.</P>
    </DocLayout>
  );
}
