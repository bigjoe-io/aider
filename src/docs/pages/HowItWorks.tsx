import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, H3, P, UL } from '../components/PageHeader';
import { Callout } from '../components/Callout';
import { Code } from '../components/CodeBlock';

const HEADINGS = [
  { id: 'actors', text: 'Actors', level: 2 },
  { id: 'the-contract', text: 'The contract', level: 2 },
  { id: 'where-funds-live', text: 'Where funds live', level: 2 },
  { id: 'life-of-a-payment', text: 'Life of a payment', level: 2 },
  { id: 'daily-limit-window', text: 'Daily limit window', level: 2 },
];

export function HowItWorks() {
  return (
    <DocLayout slug="how-it-works" headings={HEADINGS}>
      <PageHeader
        title="How it works"
        summary="The contract, where funds live, and the life of a payment."
      />

      <H2 id="actors">Actors</H2>
      <P>There are two roles:</P>
      <UL>
        <li>
          <strong>Owner</strong> — the Ethereum address that called <Code>createWallet()</Code>.
          The owner deposits USDC, sets agent limits, approves or rejects large payments, and can
          withdraw any unreserved balance at any time. Only one address per wallet.
        </li>
        <li>
          <strong>Agent</strong> — an Ethereum address added by the owner with <Code>addAgent()</Code>.
          The agent holds a private key and uses it to sign transactions that call <Code>agentPay()</Code>
          or <Code>requestPayment()</Code>. An agent can never withdraw, change its own limits, or
          approve its own requests.
        </li>
      </UL>

      <H2 id="the-contract">The contract</H2>
      <P>
        Aider is a single non-upgradeable smart contract at{' '}
        <Code>0xed32e15d81e7864bf19caea4333bd0781f328ba3</Code> on Arc Testnet. It holds USDC using
        the ERC-20 interface at <Code>0x3600000000000000000000000000000000000000</Code>.
      </P>
      <P>
        On Arc, USDC is both the native gas token and an ERC-20. The contract uses the ERC-20
        interface so that all balances, transfers, and approvals work in standard 6-decimal USDC.
      </P>
      <Callout kind="note">
        There is no global contract owner. Each wallet is independently owned by the address that
        created it. No one else (including the contract deployer) can move your funds.
      </Callout>

      <H2 id="where-funds-live">Where funds live</H2>
      <P>
        When you deposit USDC, it transfers from your wallet into the contract's balance. The contract
        tracks three values per wallet:
      </P>
      <UL>
        <li><strong>balance</strong> — total USDC in the wallet, including reserved amounts.</li>
        <li><strong>reserved</strong> — USDC locked by pending approval requests (cannot be spent or withdrawn).</li>
        <li><strong>available</strong> — <Code>balance − reserved</Code>. This is what agents can spend and what owners can withdraw.</li>
      </UL>

      <H2 id="life-of-a-payment">Life of a payment</H2>
      <H3 id="instant-pay">Instant payment</H3>
      <P>
        The agent calls <Code>agentPay(walletId, to, amount, memo)</Code>. The contract checks, in order:
      </P>
      <OL>
        <li>Wallet exists and is not paused.</li>
        <li>Caller is an active, non-expired agent of that wallet.</li>
        <li>Recipient is not blocked and (if in allowlist mode) is on the allowlist.</li>
        <li>Amount ≤ agent's <Code>perPaymentLimit</Code>.</li>
        <li>Agent's <Code>spentToday + amount</Code> ≤ agent's <Code>dailyLimit</Code>.</li>
        <li>Available balance ≥ amount.</li>
      </OL>
      <P>
        If all checks pass: <Code>spentToday</Code> increases, <Code>balance</Code> decreases,
        and USDC transfers directly to the recipient in the same transaction.
      </P>

      <H3 id="approval-request">Approval request</H3>
      <P>
        If the payment exceeds <Code>perPaymentLimit</Code> or <Code>dailyLimit</Code>, the agent calls{' '}
        <Code>requestPayment()</Code>. The amount is reserved immediately (it cannot be spent or
        withdrawn while the request is pending). The owner approves or rejects it. If neither happens
        before the TTL (1800 seconds = 30 minutes by default from the CLI), anyone can call{' '}
        <Code>expireRequest()</Code> to release the reservation.
      </P>
      <P>
        Approved requests do not count toward the agent's daily limit — only direct <Code>agentPay</Code>{' '}
        calls do.
      </P>

      <H3 id="blocked">Blocked payment</H3>
      <P>
        If the wallet is paused, the agent is revoked or expired, or the recipient is blocked, the
        transaction reverts with a specific custom error. The CLI surfaces this as a JSON error
        object with a clear message and hint.
      </P>

      <H2 id="daily-limit-window">Daily limit window</H2>
      <P>
        The daily limit resets at UTC midnight. The contract calculates the current day as{' '}
        <Code>block.timestamp - (block.timestamp % 86400)</Code>. When an agent makes a payment
        on a new day, the contract automatically resets <Code>spentToday</Code> to zero before
        checking the limit.
      </P>
    </DocLayout>
  );
}

function OL({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal pl-5 space-y-1.5 text-[var(--ink-2)] text-sm mb-4">{children}</ol>;
}
