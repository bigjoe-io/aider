import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, P, UL } from '../components/PageHeader';
import { Callout } from '../components/Callout';
import { CodeBlock, Code } from '../components/CodeBlock';

const HEADINGS = [
  { id: 'revoke-agent', text: 'Revoke an agent', level: 2 },
  { id: 'pause-wallet', text: 'Pause the wallet', level: 2 },
  { id: 'comparison', text: 'Revoke vs pause', level: 2 },
];

export function RevokeAndPause() {
  return (
    <DocLayout slug="revoke-and-pause" headings={HEADINGS}>
      <PageHeader
        title="Revoking and pausing"
        summary="Revoke one agent or stop every agent at once."
      />

      <H2 id="revoke-agent">Revoke an agent</H2>
      <P>
        Call <Code>revokeAgent(walletId, agentAddress)</Code> from the owner's wallet. The agent's{' '}
        <Code>active</Code> flag is set to <Code>false</Code> immediately. The change is permanent —
        the same address can be re-added with <Code>addAgent</Code>, but revoking it again requires
        another transaction.
      </P>
      <CodeBlock language="bash">
{`cast send 0xed32e15d81e7864bf19caea4333bd0781f328ba3 \\
  "revokeAgent(uint256,address)" \\
  1 0xAGENT_ADDRESS \\
  --rpc-url https://rpc.testnet.arc.io \\
  --private-key $OWNER_PRIVATE_KEY`}
      </CodeBlock>
      <P>After this transaction:</P>
      <UL>
        <li>Any call to <Code>agentPay</Code> or <Code>requestPayment</Code> from that address reverts with <Code>AgentRevokedError</Code>.</li>
        <li>Pending approval requests from that agent are NOT automatically rejected — the owner can still approve or reject them. The agent cannot create new ones.</li>
        <li>The <Code>aidr pay</Code> command checks <Code>agent.active</Code> before sending a transaction, so the agent gets a clear error before hitting the chain.</li>
      </UL>

      <Callout kind="warning">
        Revocation does not cancel pending approval requests. If there are outstanding requests
        from a compromised agent, reject them manually after revoking.
      </Callout>

      <H2 id="pause-wallet">Pause the wallet</H2>
      <P>
        Call <Code>pauseWallet(walletId, true)</Code> to stop all agents at once. No agent on
        this wallet can call <Code>agentPay</Code> or <Code>requestPayment</Code> while it is paused.
        Call <Code>pauseWallet(walletId, false)</Code> to resume.
      </P>
      <CodeBlock language="bash">
{`# Pause
cast send 0xed32e15d81e7864bf19caea4333bd0781f328ba3 \\
  "pauseWallet(uint256,bool)" 1 true \\
  --rpc-url https://rpc.testnet.arc.io \\
  --private-key $OWNER_PRIVATE_KEY

# Resume
cast send 0xed32e15d81e7864bf19caea4333bd0781f328ba3 \\
  "pauseWallet(uint256,bool)" 1 false \\
  --rpc-url https://rpc.testnet.arc.io \\
  --private-key $OWNER_PRIVATE_KEY`}
      </CodeBlock>
      <P>
        Pausing does not affect the owner. The owner can still deposit, withdraw, approve requests,
        and manage agents while the wallet is paused.
      </P>

      <H2 id="comparison">Revoke vs pause</H2>
      <table className="w-full text-sm border-collapse my-4 overflow-x-auto block">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-2 pr-6 text-[var(--ink)] font-semibold">Action</th>
            <th className="text-left py-2 pr-6 text-[var(--ink)] font-semibold">Scope</th>
            <th className="text-left py-2 text-[var(--ink)] font-semibold">Reversible?</th>
          </tr>
        </thead>
        <tbody className="text-[var(--ink-2)]">
          <tr className="border-b border-[var(--border)]">
            <td className="py-2 pr-6"><Code>revokeAgent</Code></td>
            <td className="py-2 pr-6">One agent only</td>
            <td className="py-2">Yes — call <Code>addAgent</Code> again</td>
          </tr>
          <tr>
            <td className="py-2 pr-6"><Code>pauseWallet(true)</Code></td>
            <td className="py-2 pr-6">Every agent on the wallet</td>
            <td className="py-2">Yes — call <Code>pauseWallet(false)</Code></td>
          </tr>
        </tbody>
      </table>
    </DocLayout>
  );
}
