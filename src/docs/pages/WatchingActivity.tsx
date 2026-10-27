import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, P } from '../components/PageHeader';
import { CodeBlock, Code } from '../components/CodeBlock';
import { Table } from '../components/Table';

const HEADINGS = [
  { id: 'events', text: 'Events', level: 2 },
  { id: 'listening', text: 'Listening for events', level: 2 },
];

export function WatchingActivity() {
  return (
    <DocLayout slug="watching-activity" headings={HEADINGS}>
      <PageHeader
        title="Watching activity"
        summary="Contract events, what each contains, and how to listen."
      />

      <H2 id="events">Events</H2>
      <Table
        headers={['Event', 'Indexed fields', 'Non-indexed fields', 'When emitted']}
        rows={[
          [<Code>WalletCreated</Code>, 'walletId, owner', '—', 'createWallet()'],
          [<Code>Deposited</Code>, 'walletId', 'amount', 'deposit()'],
          [<Code>Withdrawn</Code>, 'walletId', 'amount', 'withdraw()'],
          [<Code>WalletPausedEvent</Code>, 'walletId', 'paused (bool)', 'pauseWallet()'],
          [<Code>AgentAdded</Code>, 'walletId, agent', 'label', 'addAgent()'],
          [<Code>AgentUpdated</Code>, 'walletId, agent', '—', 'updateAgent()'],
          [<Code>AgentRevoked</Code>, 'walletId, agent', '—', 'revokeAgent()'],
          [<Code>AgentPaid</Code>, 'walletId, agent, to', 'amount, memo', 'agentPay() on success'],
          [<Code>PaymentRequested</Code>, 'requestId, walletId, agent', 'to, amount, memo, expiresAt', 'requestPayment()'],
          [<Code>RequestApproved</Code>, 'requestId, walletId', '—', 'approveRequest()'],
          [<Code>RequestRejected</Code>, 'requestId, walletId', '—', 'rejectRequest()'],
          [<Code>RequestExpired</Code>, 'requestId, walletId', '—', 'expireRequest()'],
          [<Code>RecipientModeSet</Code>, 'walletId', 'mode', 'setRecipientMode()'],
          [<Code>AllowlistUpdated</Code>, 'walletId', 'recipient, allowed', 'setAllowlist()'],
          [<Code>BlocklistUpdated</Code>, 'walletId', 'recipient, blocked', 'setBlocklist()'],
        ]}
      />

      <H2 id="listening">Listening for events</H2>
      <P>Using viem to watch for payments on a specific wallet:</P>
      <CodeBlock language="typescript">
{`import { createPublicClient, http, parseAbiItem } from 'viem';
import { arcTestnet } from 'viem/chains';

const client = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.io'),
});

const CONTRACT = '0xed32e15d81e7864bf19caea4333bd0781f328ba3';
const WALLET_ID = 1n;

// Subscribe to all AgentPaid events on wallet #1
const unwatch = client.watchEvent({
  address: CONTRACT,
  event: parseAbiItem(
    'event AgentPaid(uint256 indexed walletId, address indexed agent, address indexed to, uint256 amount, string memo)'
  ),
  args: { walletId: WALLET_ID },
  onLogs: (logs) => {
    for (const log of logs) {
      console.log('Payment:', log.args.amount, 'to', log.args.to, '—', log.args.memo);
    }
  },
});

// Stop watching
unwatch();`}
      </CodeBlock>

      <P>
        The <Code>aidr history</Code> command scans the last 10,000 blocks for <Code>AgentPaid</Code>{' '}
        events filtered by the configured wallet ID and agent address.
      </P>
    </DocLayout>
  );
}
