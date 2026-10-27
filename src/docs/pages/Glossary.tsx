import { DocLayout } from '../components/DocLayout';
import { PageHeader } from '../components/PageHeader';
import { Code } from '../components/CodeBlock';

const TERMS: { term: string; definition: string }[] = [
  {
    term: 'Owner',
    definition:
      'The Ethereum address that called createWallet(). The owner deposited the funds, sets agent limits, approves or rejects large payments, and is the only address that can withdraw.',
  },
  {
    term: 'Agent',
    definition:
      'An Ethereum address added to an Aider wallet by the owner via addAgent(). The agent holds a private key used to sign agentPay and requestPayment transactions. An agent cannot withdraw, change its own limits, or approve its own requests.',
  },
  {
    term: 'Agent key',
    definition:
      'The Ethereum private key that authorises an agent to transact. Stored in ~/.leash/key with mode 600. Never printed or logged by the CLI. If compromised, the owner can revoke it instantly.',
  },
  {
    term: 'Wallet',
    definition:
      'A record in the Aider contract, identified by a numeric ID, that holds a USDC balance and a set of agents. Not to be confused with an Ethereum wallet. One owner address can create many wallets.',
  },
  {
    term: 'Per-payment limit',
    definition:
      'The maximum USDC amount for a single agentPay call. Payments over this limit must use requestPayment instead. Set when adding an agent; changeable via updateAgent.',
  },
  {
    term: 'Daily limit',
    definition:
      'The maximum total USDC an agent can spend via agentPay in one UTC day. Resets automatically at UTC midnight on the next payment. Set when adding an agent; changeable via updateAgent.',
  },
  {
    term: 'Approval request',
    definition:
      'A record created by requestPayment() when a payment exceeds the per-payment or daily limit. Funds are reserved immediately. The owner approves or rejects the request. Approved requests do not count toward the daily limit.',
  },
  {
    term: 'Reservation',
    definition:
      'USDC held in a wallet that is locked by one or more pending approval requests. Reserved funds cannot be spent by agents or withdrawn by the owner until the request is resolved. wallet.available = wallet.balance − wallet.reserved.',
  },
  {
    term: 'TTL',
    definition:
      'Time-to-live. The number of seconds an approval request stays PENDING before it can be expired by anyone calling expireRequest(). The aidr pay CLI hardcodes a TTL of 1800 seconds (30 minutes).',
  },
  {
    term: 'Revoke',
    definition:
      'The act of calling revokeAgent() to set an agent\'s active flag to false. A revoked agent cannot make payments or create requests. The key can be re-added with addAgent().',
  },
  {
    term: 'Pause',
    definition:
      'A wallet-level flag (set by pauseWallet) that blocks all agentPay and requestPayment calls for every agent on that wallet. The owner\'s own actions are unaffected. Resuming requires calling pauseWallet(id, false).',
  },
  {
    term: 'Allowlist',
    definition:
      'A set of recipient addresses that agents are allowed to pay when the wallet is in ALLOWLIST mode. Managed with setAllowlist(). Has no effect in ANY mode.',
  },
  {
    term: 'Blocklist',
    definition:
      'A set of recipient addresses that agents can never pay, regardless of the wallet mode. Managed with setBlocklist(). Checked before the allowlist.',
  },
  {
    term: 'USDC',
    definition:
      'USD Coin, a stablecoin issued by Circle, pegged 1:1 to the US dollar. On Arc, USDC is both the native gas token and an ERC-20 at address 0x3600000000000000000000000000000000000000. Aider uses the ERC-20 interface exclusively. All amounts are in 6-decimal units (1 USDC = 1,000,000).',
  },
  {
    term: 'Arc',
    definition:
      'The blockchain on which Aider is deployed. Arc uses USDC as its native gas token, meaning transactions are paid for in USDC rather than ETH or another volatile asset.',
  },
  {
    term: 'spentToday',
    definition:
      'A per-agent counter tracking how much USDC the agent has spent via agentPay in the current UTC day. Automatically reset to zero on the first agentPay call of a new UTC day.',
  },
  {
    term: 'dayStart',
    definition:
      'A per-agent timestamp recording the UTC midnight floor when spentToday was last reset. Used internally by _refreshDailySpend to detect day rollovers.',
  },
];

export function Glossary() {
  return (
    <DocLayout slug="glossary">
      <PageHeader
        title="Glossary"
        summary="Owner, agent, wallet, limit, approval request, reservation, and more."
      />

      <dl className="divide-y divide-[var(--border)]">
        {TERMS.map(({ term, definition }) => (
          <div key={term} id={term.toLowerCase().replace(/[^a-z0-9]/g, '-')} className="py-4 scroll-mt-20">
            <dt className="font-semibold text-[var(--ink)] mb-1">
              <Code>{term}</Code>
            </dt>
            <dd className="text-sm text-[var(--ink-2)] leading-relaxed pl-0">{definition}</dd>
          </div>
        ))}
      </dl>
    </DocLayout>
  );
}
