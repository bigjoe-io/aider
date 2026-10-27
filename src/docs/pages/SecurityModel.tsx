import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, P, UL } from '../components/PageHeader';
import { Callout } from '../components/Callout';
import { Code } from '../components/CodeBlock';

const HEADINGS = [
  { id: 'leaked-key', text: 'Leaked agent key', level: 2 },
  { id: 'key-storage', text: 'Key storage', level: 2 },
  { id: 'owner-responsibilities', text: 'Owner responsibilities', level: 2 },
  { id: 'unaudited', text: 'Unaudited contract', level: 2 },
];

export function SecurityModel() {
  return (
    <DocLayout slug="security-model" headings={HEADINGS}>
      <PageHeader
        title="Security model"
        summary="What a leaked key can and cannot do, and what the owner must protect."
      />

      <Callout kind="warning">
        Aider is unaudited and experimental. The contract has been reviewed internally but has
        not had a formal third-party security audit. Do not deposit more USDC than you can afford
        to lose. Keep limits small.
      </Callout>

      <H2 id="leaked-key">Leaked agent key</H2>
      <P>If an agent's private key is compromised, the attacker can:</P>
      <UL>
        <li>Make direct payments up to the per-payment limit per transaction.</li>
        <li>Spend up to the daily limit per UTC day via direct payments.</li>
        <li>Create approval requests for larger amounts — these sit pending and are visible to the owner.</li>
        <li>Set a memo on each payment (but memos are not enforced or validated by the contract).</li>
      </UL>
      <P>A compromised agent key cannot:</P>
      <UL>
        <li>Withdraw funds from the wallet — only the owner can call <Code>withdraw()</Code>.</li>
        <li>Change its own limits — only the owner can call <Code>updateAgent()</Code>.</li>
        <li>Approve its own approval requests — only the owner can call <Code>approveRequest()</Code>.</li>
        <li>Add new agents — only the owner can call <Code>addAgent()</Code>.</li>
        <li>Spend after revocation — once the owner calls <Code>revokeAgent()</Code>, the key is permanently blocked.</li>
        <li>Access other wallets — each agent key is scoped to the wallet IDs it was added to.</li>
      </UL>
      <P>
        The practical impact of a leak is bounded by the agent's limits. Keep <Code>perPaymentLimit</Code>{' '}
        and <Code>dailyLimit</Code> small.
      </P>

      <H2 id="key-storage">Key storage</H2>
      <P>
        The <Code>aidr init</Code> command stores the private key in two files:
      </P>
      <UL>
        <li><Code>~/.leash/config.json</Code> — wallet ID, agent address, contract address, RPC URL. Mode 600.</li>
        <li><Code>~/.leash/key</Code> — the private key, hex-encoded. Mode 600.</li>
      </UL>
      <Callout kind="warning">
        The key file is <strong>never printed, logged, or included in JSON output</strong> by the CLI.
        Do not move it, copy it to a less-secure location, or transmit it in any form. If an AI agent
        asks for the key, it should refuse — this is documented in SKILL.md.
      </Callout>

      <H2 id="owner-responsibilities">Owner responsibilities</H2>
      <UL>
        <li>Protect the owner private key — whoever controls it controls all funds across all your wallets.</li>
        <li>Monitor approval requests — they are visible onchain and via the <Code>getPendingRequests()</Code> view.</li>
        <li>Revoke agents you no longer use.</li>
        <li>Withdraw idle funds — funds in the contract are only as safe as the contract.</li>
        <li>Keep limits proportionate to the task — an agent that writes blog posts does not need a $10/day limit.</li>
      </UL>

      <H2 id="unaudited">Unaudited contract</H2>
      <P>
        The contract was written with reentrancy protection (OpenZeppelin <Code>ReentrancyGuard</Code>)
        and follows checks-effects-interactions ordering. It has been reviewed and tested (52 unit
        tests pass), but it has not been audited by an independent security firm.
      </P>
      <P>
        Known limitations: <Code>getPendingRequests()</Code> is O(n) over all historical requests —
        gas cost grows with usage. The USDC address is hardcoded for Arc and cannot be changed.
      </P>
    </DocLayout>
  );
}
