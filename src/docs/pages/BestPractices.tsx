import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, P, UL } from '../components/PageHeader';
import { Callout } from '../components/Callout';
import { Code } from '../components/CodeBlock';

const HEADINGS = [
  { id: 'limits', text: 'Keep limits small', level: 2 },
  { id: 'one-key-per-agent', text: 'One key per agent', level: 2 },
  { id: 'memos', text: 'Always use clear memos', level: 2 },
  { id: 'history-before-retry', text: 'Check history before retrying', level: 2 },
  { id: 'revoke-unused', text: 'Revoke unused agents', level: 2 },
  { id: 'withdraw-idle', text: 'Withdraw idle funds', level: 2 },
];

export function BestPractices() {
  return (
    <DocLayout slug="best-practices" headings={HEADINGS}>
      <PageHeader
        title="Best practices"
        summary="Limits, memos, history checks, unused agents, and idle funds."
      />

      <H2 id="limits">Keep limits small</H2>
      <P>
        Start with the smallest limits that let the agent do its job. You can always raise them with
        one transaction. A 0.10 USDC per-payment limit and a 0.50 USDC daily limit are reasonable
        starting points for most API-calling agents.
      </P>
      <Callout kind="tip">
        Think about the worst case: if the agent misbehaves or is compromised and hits the limits
        continuously for a full day, how much USDC is at risk? That is your daily limit.
      </Callout>

      <H2 id="one-key-per-agent">One key per agent</H2>
      <P>
        Never share an agent key between two different agents or processes. Each should have its own
        Ethereum address and its own entry in the Aider wallet. This way you can revoke one agent
        without affecting others, and the spending history in <Code>aidr history</Code> is
        attributable to one specific agent.
      </P>

      <H2 id="memos">Always use clear memos</H2>
      <P>
        The <Code>memo</Code> field is stored in the event log and visible to anyone who reads the
        chain. Write something that tells you later what the payment was for:
      </P>
      <UL>
        <li>Good: <Code>"API credits — run #42, model gpt-4o, 1200 tokens"</Code></li>
        <li>Bad: <Code>"payment"</Code></li>
        <li>Bad: <Code>""</Code> (the CLI requires a non-empty memo)</li>
      </UL>
      <P>
        The memo is not validated by the contract — it is stored as-is. Keep it short (a long memo
        costs more gas) and avoid sensitive information.
      </P>

      <H2 id="history-before-retry">Check history before retrying a payment</H2>
      <P>
        If a payment seems to have timed out or you are not sure whether it went through, always run{' '}
        <Code>aidr history</Code> before trying again. A successful payment emits an <Code>AgentPaid</Code>{' '}
        event that <Code>aidr history</Code> will find. Retrying without checking can pay twice.
      </P>
      <Callout kind="warning">
        A timed-out network request does not mean the transaction failed. The transaction may have
        been mined while the CLI was waiting. Always check before retrying.
      </Callout>

      <H2 id="revoke-unused">Revoke unused agents</H2>
      <P>
        When an agent is no longer in use — the model run ended, the project finished, the token
        was rotated — revoke it. A dormant key with non-zero limits is an unnecessary attack surface.
        Revoking takes one transaction and costs a small amount of gas.
      </P>

      <H2 id="withdraw-idle">Withdraw idle funds</H2>
      <P>
        Do not leave large balances in the contract indefinitely. Withdraw unreserved USDC when you
        are done with a project or when a long break is expected. The contract is not insured and has
        not been audited by an independent firm.
      </P>
    </DocLayout>
  );
}
