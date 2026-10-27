import { DocLayout } from '../components/DocLayout';
import { PageHeader, H2, P, OL } from '../components/PageHeader';
import { Callout } from '../components/Callout';
import { CodeBlock, Code } from '../components/CodeBlock';

const HEADINGS = [
  { id: 'prerequisites', text: 'Prerequisites', level: 2 },
  { id: 'create-wallet', text: '1. Create a wallet', level: 2 },
  { id: 'deposit', text: '2. Deposit USDC', level: 2 },
  { id: 'add-agent', text: '3. Add an agent', level: 2 },
  { id: 'next-steps', text: 'Next steps', level: 2 },
];

export function QuickstartOwners() {
  return (
    <DocLayout slug="quickstart-owners" headings={HEADINGS}>
      <PageHeader
        title="Quickstart for owners"
        summary="Create a wallet, deposit USDC, and add an agent with limits."
      />

      <Callout kind="warning">
        All transactions on Arc Testnet use test USDC with no real value. For mainnet, use the
        same steps with real funds — but keep amounts small until you are comfortable with the system.
      </Callout>

      <H2 id="prerequisites">Prerequisites</H2>
      <UL>
        <li>A wallet connected to Arc Testnet (MetaMask or any injected wallet).</li>
        <li>Some test USDC — use the "Get test USDC" button in the Arc Studio sidebar.</li>
        <li>The agent's Ethereum address (you'll set the key on the agent's machine separately).</li>
      </UL>

      <H2 id="create-wallet">1. Create a wallet</H2>
      <P>
        Call <Code>createWallet()</Code> on the Aider contract. This records your address as the owner
        and returns a numeric wallet ID. You can create as many wallets as you need — each is
        independent, with its own balance and agents.
      </P>
      <P>
        The contract address on Arc Testnet is{' '}
        <Code>0xed32e15d81e7864bf19caea4333bd0781f328ba3</Code>.
      </P>
      <Callout kind="note">
        The wallet ID starts at 1 and increments globally. Your first wallet will be 1 if you are
        the first user, or a higher number if others have created wallets before you.
      </Callout>

      <H2 id="deposit">2. Deposit USDC</H2>
      <P>
        Before depositing, approve the contract to spend your USDC:
      </P>
      <CodeBlock language="bash">
{`# Approve the Aider contract to spend 100 USDC from your wallet
# (approval amount in 6-decimal units: 100 USDC = 100_000_000)
cast send 0x3600000000000000000000000000000000000000 \\
  "approve(address,uint256)" \\
  0xed32e15d81e7864bf19caea4333bd0781f328ba3 \\
  100000000 \\
  --rpc-url https://rpc.testnet.arc.io \\
  --private-key $OWNER_PRIVATE_KEY`}
      </CodeBlock>
      <P>Then deposit:</P>
      <CodeBlock language="bash">
{`cast send 0xed32e15d81e7864bf19caea4333bd0781f328ba3 \\
  "deposit(uint256,uint256)" \\
  1 100000000 \\
  --rpc-url https://rpc.testnet.arc.io \\
  --private-key $OWNER_PRIVATE_KEY`}
      </CodeBlock>
      <P>
        The first argument is the wallet ID, the second is the USDC amount in 6-decimal units.
        100 USDC = <Code>100000000</Code>.
      </P>

      <H2 id="add-agent">3. Add an agent</H2>
      <P>
        You need the agent's Ethereum address. The agent generates this from their private key —
        see Quickstart for agents.
      </P>
      <CodeBlock language="bash">
{`cast send 0xed32e15d81e7864bf19caea4333bd0781f328ba3 \\
  "addAgent(uint256,address,string,uint256,uint256,uint256)" \\
  1 \\
  0xAGENT_ADDRESS \\
  "Claude Code" \\
  100000 \\
  500000 \\
  0 \\
  --rpc-url https://rpc.testnet.arc.io \\
  --private-key $OWNER_PRIVATE_KEY`}
      </CodeBlock>
      <P>Parameters:</P>
      <UL>
        <li><Code>1</Code> — wallet ID</li>
        <li><Code>0xAGENT_ADDRESS</Code> — the agent's Ethereum address</li>
        <li><Code>"Claude Code"</Code> — a human-readable label</li>
        <li><Code>100000</Code> — <Code>perPaymentLimit</Code>: 0.10 USDC (6-decimal units)</li>
        <li><Code>500000</Code> — <Code>dailyLimit</Code>: 0.50 USDC</li>
        <li><Code>0</Code> — <Code>expiresAt</Code>: 0 means the key never expires</li>
      </UL>

      <Callout kind="tip">
        Keep the per-payment limit small at first. You can always raise it later with{' '}
        <Code>updateAgent</Code>. An agent with a 0.10 USDC per-payment limit can never make a single
        direct payment larger than that — for anything bigger it creates an approval request.
      </Callout>

      <H2 id="next-steps">Next steps</H2>
      <OL>
        <li>Give the agent their private key and wallet ID — they run <Code>aidr init</Code> to configure.</li>
        <li>Check the <a href="/docs/spending-rules" className="underline hover:text-[var(--ink)]">Spending rules</a> page for all the limits you can configure.</li>
        <li>Set up recipient rules if you want to restrict where the agent can pay.</li>
      </OL>
    </DocLayout>
  );
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5 text-[var(--ink-2)] text-sm mb-4">{children}</ul>;
}
