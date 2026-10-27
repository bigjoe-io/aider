import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, H3, P, UL } from '../components/PageHeader';
import { Callout } from '../components/Callout';
import { Code } from '../components/CodeBlock';

const HEADINGS = [
  { id: 'when-created', text: 'When they are created', level: 2 },
  { id: 'reservation', text: 'Fund reservation', level: 2 },
  { id: 'lifecycle', text: 'Lifecycle', level: 2 },
  { id: 'daily-limit', text: 'Daily limit and approved requests', level: 2 },
  { id: 'ttl', text: 'TTL', level: 2 },
];

export function ApprovalRequests() {
  return (
    <DocLayout slug="approval-requests" headings={HEADINGS}>
      <PageHeader
        title="Approval requests"
        summary="Over-limit payments, fund reservation, approve/reject/expire."
      />

      <H2 id="when-created">When they are created</H2>
      <P>
        An approval request is created by the agent calling <Code>requestPayment(walletId, to, amount, memo, ttlSeconds)</Code>.
        The CLI does this automatically when <Code>agentPay</Code> fails with <Code>OverPerPaymentLimit</Code>,{' '}
        <Code>OverDailyLimit</Code>, or <Code>InsufficientBalance</Code> (unless <Code>--no-request</Code> is passed).
      </P>
      <P>
        The same eligibility checks that apply to <Code>agentPay</Code> also apply here: the agent
        must be active and non-expired, the wallet must not be paused, and the recipient must pass
        the blocklist and allowlist checks. The difference is that the per-payment and daily limits
        are not checked — that is the whole point.
      </P>

      <H2 id="reservation">Fund reservation</H2>
      <P>
        When a request is created, the contract immediately adds the requested amount to{' '}
        <Code>wallet.reserved</Code>. Reserved funds cannot be spent by agents or withdrawn by the
        owner until the request is resolved. This prevents double-spending: the same USDC cannot
        be promised to two different payments.
      </P>
      <P>
        <Code>wallet.available = wallet.balance − wallet.reserved</Code>. If you have 10 USDC and
        one pending request for 3 USDC, the available balance is 7 USDC.
      </P>

      <H2 id="lifecycle">Lifecycle</H2>
      <P>A request can be in one of four states:</P>
      <UL>
        <li><strong>PENDING</strong> — waiting for the owner to approve or reject.</li>
        <li><strong>APPROVED</strong> — the owner approved it; funds transferred to the recipient.</li>
        <li><strong>REJECTED</strong> — the owner rejected it; reservation released, no funds moved.</li>
        <li><strong>EXPIRED</strong> — the TTL passed; anyone called <Code>expireRequest()</Code>; reservation released.</li>
      </UL>

      <H3 id="approve">approveRequest</H3>
      <P>
        Only the wallet owner can call <Code>approveRequest(requestId)</Code>. The contract checks
        that the request is still PENDING and has not expired. It also re-validates the recipient
        against the current blocklist and allowlist — if the owner has blocked the recipient after
        the request was created, the approval will revert.
      </P>

      <H3 id="reject">rejectRequest</H3>
      <P>
        Only the wallet owner can call <Code>rejectRequest(requestId)</Code>. The request moves
        to REJECTED and the reserved amount is released immediately. No funds are transferred.
      </P>

      <H3 id="expire">expireRequest</H3>
      <P>
        Anyone can call <Code>expireRequest(requestId)</Code> after the TTL has passed. The request
        moves to EXPIRED and the reservation is released. This is a public function so that
        reservations are not locked forever if the owner never acts.
      </P>

      <Callout kind="note">
        A request cannot be approved after it has expired — <Code>approveRequest</Code> checks
        <Code>block.timestamp ≤ expiresAt</Code> and reverts with <Code>RequestExpiredError</Code> if not.
      </Callout>

      <H2 id="daily-limit">Daily limit and approved requests</H2>
      <P>
        Approved requests do <em>not</em> count toward the agent's daily limit. Only direct{' '}
        <Code>agentPay</Code> calls increment <Code>spentToday</Code>. This means an agent at its
        daily cap can still have a large pending request approved — the daily limit is a cap on
        autonomous spending, not on all spending.
      </P>

      <H2 id="ttl">TTL</H2>
      <P>
        The TTL is set in seconds by the caller. The <Code>aidr pay</Code> CLI hardcodes a TTL of
        1800 seconds (30 minutes). Directly calling the contract lets you set any TTL greater than zero.
        A TTL of zero reverts with <Code>InvalidTTL</Code>.
      </P>
    </DocLayout>
  );
}
