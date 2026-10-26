import { ArrowDown, Bot, Code2, FlaskConical, Network, Search, Users } from 'lucide-react'
import { Button, Panel } from '@/components/ui'
import { SectionReveal } from '@/components/site'
import { AIDER_ADDRESS, AIDER_CHAIN_NAME, explorerAddress } from '@/aider/config'
import { cn } from '@/lib/cn'
import { DeveloperCode, LivePanelCards, NetworkPill } from './Interactive'

export function Hero() {
  return (
    <section className="container-x pt-2">
      <Panel tone="plain" className="glow-hero noise relative flex min-h-[min(78vh,760px)] flex-col overflow-hidden border border-line p-6 sm:p-10 lg:p-14">
        <div className="relative z-10">
          <NetworkPill />
        </div>
        <div className="relative z-10 mt-auto flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[640px]">
            <h1 className="text-display text-fg">
              Your agent spends.
              <br />
              You stay in control.
            </h1>
            <p className="text-lead mt-6 max-w-[560px]">
              A USDC wallet for AI agents on Arc. Give each agent its own key with limits. Small payments go through on their own, bigger ones wait for
              your approval, and one click cuts an agent off.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Button href="/app" size="lg">
                Open app
              </Button>
              <Button href="/docs" variant="link" size="lg" className="text-fg">
                Read the docs
              </Button>
            </div>
          </div>
          <a
            href="#product"
            className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-bg/30 px-4 py-2.5 text-sm text-fg-2 backdrop-blur transition-colors hover:text-fg lg:self-end"
          >
            Scroll to explore <ArrowDown className="size-3.5" />
          </a>
        </div>
      </Panel>
    </section>
  )
}

const BUILT_ON = [
  { name: 'Arc', mark: <span className="block size-5 rounded-full border-[3px] border-fg border-b-transparent" /> },
  { name: 'USDC', mark: <span className="grid size-6 place-items-center rounded-full border-2 border-fg text-[11px] font-semibold">$</span> },
  { name: 'Arc Studio', mark: <span className="block size-5 rounded-[6px] border-2 border-fg" /> },
]

export function BuiltOn() {
  return (
    <section className="container-x py-16 text-center">
      <p className="text-sm text-fg-3">Built on</p>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
        {BUILT_ON.map((b) => (
          <li key={b.name} className="flex items-center gap-3 text-xl text-fg">
            {b.mark}
            {b.name}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ProductColumns() {
  const cols = [
    { label: 'The app', title: 'Set the rules', text: 'Fund a wallet, add your agents and decide what each one can spend. Approve bigger payments from one inbox.', cta: 'Open app', href: '/app' },
    {
      label: 'The contract',
      title: 'Rules enforced onchain',
      text: 'Every limit lives in one small contract on Arc. Only you can withdraw: there is no admin key.',
      cta: 'View the contract',
      href: AIDER_ADDRESS ? explorerAddress(AIDER_ADDRESS) : '/docs/contract-reference',
    },
    { label: 'The CLI', title: 'Give it to your agent', text: 'A small command-line tool and a SKILL.md file let Claude Code, or any agent with a terminal, pay on its own.', cta: 'Read SKILL.md', href: '/docs/skill-md' },
  ]
  return (
    <section id="product" className="container-x scroll-mt-24 py-10">
      <div className="grid gap-10 md:grid-cols-3 md:gap-10">
        {cols.map((c) => (
          <SectionReveal key={c.label} className="hairline-top flex flex-col pt-5">
            <p className="label">{c.label}</p>
            <h3 className="mt-3 text-[22px] font-normal text-fg">{c.title}</h3>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-fg-2">{c.text}</p>
            <Button href={c.href} variant="link" className="mt-6 self-start text-fg">
              {c.cta}
            </Button>
          </SectionReveal>
        ))}
      </div>
    </section>
  )
}

const ASKS = [
  { what: 'API credits', amount: '$0.05' },
  { what: 'Summary job', amount: '$0.08' },
  { what: 'Premium dataset', amount: '$1.00' },
  { what: 'Retry', amount: '$0.01' },
]
const OUTCOMES = [
  { what: 'Paid', note: 'within limits', tone: 'ok' },
  { what: 'Paid', note: 'agent-to-agent', tone: 'ok' },
  { what: 'Waiting for you', note: 'over the $0.10 limit', tone: 'warn' },
  { what: 'Blocked', note: 'agent revoked', tone: 'danger' },
] as const

function StripCard({ title, sub, right, dot }: { title: string; sub: string; right?: string; dot?: 'ok' | 'warn' | 'danger' }) {
  return (
    <div className="w-[230px] shrink-0 rounded-[18px] border border-line bg-surface px-4 py-4">
      <div className="flex items-center justify-between text-[13px] text-fg-3">
        <span>{sub}</span>
        {dot && <span className={cn('size-1.5 rounded-full', dot === 'ok' ? 'bg-accent' : dot === 'warn' ? 'bg-warn' : 'bg-danger')} />}
      </div>
      <p className="mt-5 flex items-baseline justify-between gap-3 text-fg">
        <span className="truncate text-[17px]">{title}</span>
        {right && <span className="mono-num text-xl font-light">{right}</span>}
      </p>
    </div>
  )
}

export function Statement() {
  return (
    <section className="py-24 md:py-32">
      <SectionReveal className="container-x mx-auto max-w-[920px] text-center">
        <h2 className="text-h2 text-fg">An agent with your private key can spend everything. Give it an allowance instead.</h2>
        <p className="text-lead mx-auto mt-6 max-w-[720px]">
          Agents pay for APIs, data and other agents’ work. A funded private key in an agent’s environment means one bad prompt, one leaked key or one
          runaway loop can empty it. Aider keeps the money in a contract and gives the agent a key that can only spend inside your rules.
        </p>
      </SectionReveal>

      <div className="aider-marquee-wrap relative mt-16" aria-label="Example payments passing through your rules">
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <div className="aider-marquee flex w-max gap-4">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-4" aria-hidden={copy === 1}>
                {ASKS.map((a, i) => (
                  <StripCard key={`a${i}`} title={a.what} sub="Agent asks" right={a.amount} />
                ))}
                {OUTCOMES.map((o, i) => (
                  <StripCard key={`o${i}`} title={o.what} sub={o.note} dot={o.tone} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-[-18px] left-1/2 w-[120px] -translate-x-1/2 rounded-[22px] border border-line-strong bg-bg/70 backdrop-blur-md">
          <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-accent to-transparent" />
          <p className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[13px] text-fg-2">Your rules</p>
        </div>
      </div>
      <div className="container-x mt-16 grid grid-cols-2 text-center text-[13px] text-fg-3">
        <p>What your agent asks for</p>
        <p>What actually happens</p>
      </div>
    </section>
  )
}

export function LivePanel() {
  return (
    <section className="container-x">
      <Panel className="px-5 py-16 sm:px-10 md:py-24">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 className="text-h2 text-fg">Live on {AIDER_CHAIN_NAME}</h2>
          <p className="text-lead mt-5">
            Fund a wallet, give an agent a key and watch the rules hold. Every payment, request and approval is a real USDC transaction you can look up
            on the explorer.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-[1100px]">
          <LivePanelCards />
        </div>
      </Panel>
    </section>
  )
}

export function Comparison() {
  return (
    <section id="security" className="container-x scroll-mt-24 py-24 md:py-32">
      <SectionReveal className="max-w-[760px]">
        <h2 className="text-h2 text-fg">
          Your money has one owner.
          <br />
          Agents get a key, not the vault.
        </h2>
        <p className="text-lead mt-6">
          Most agent wallets hand the agent a funded private key and hope for the best. With Aider the funds sit in a contract only you can withdraw
          from. Each agent signs with its own key, and the contract checks every payment against your rules first.
        </p>
      </SectionReveal>
      <div className="mt-12 grid gap-3 md:grid-cols-2">
        <div className="rounded-[24px] border border-line bg-surface p-8 sm:p-10">
          <p className="label">Hot wallet</p>
          <p className="mt-1 text-sm text-fg-3">A funded key in the agent’s environment</p>
          <h3 className="mt-10 text-[22px] font-normal text-fg">The agent holds the key to everything.</h3>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-fg-2">If the key leaks or the agent loops, the whole balance can leave in one transaction.</p>
        </div>
        <div className="rounded-[24px] border border-accent/25 bg-accent-soft p-8 sm:p-10">
          <p className="label !text-accent">Aider</p>
          <p className="mt-1 text-sm text-fg-3">Scoped agent keys</p>
          <h3 className="mt-10 text-[22px] font-normal text-fg">The agent can only spend what you allow.</h3>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-fg-2">
            A leaked agent key can spend at most its daily limit per UTC day, and nothing at all once you revoke it.
          </p>
        </div>
      </div>
      <p className="mt-6 max-w-[720px] text-[15px] leading-relaxed text-fg-2">
        Agent keys never hold your funds: every payment passes the contract’s checks first.{' '}
        <Button href="/docs/security-model" variant="link" className="text-fg">
          How the security model works
        </Button>
      </p>
    </section>
  )
}

const USES = [
  { icon: Code2, title: 'Coding agents', text: 'Let Claude Code or Cursor buy API credits and tools mid-task, inside a daily budget.' },
  { icon: Search, title: 'Research agents', text: 'Pay for datasets, reports and paywalled sources, with a memo on every payment.' },
  { icon: Network, title: 'Agent-to-agent', text: 'Agents pay other agents’ addresses for work, each side with its own limits.' },
  { icon: Bot, title: 'Bots and automations', text: 'Scheduled jobs pay for exactly what they use, without a card on file or a shared key.' },
  { icon: Users, title: 'Teams', text: 'One wallet, many agents, each with its own label, limits and expiry.' },
  { icon: FlaskConical, title: 'Experiments', text: 'Try a paid tool with a $5 budget and a 7-day expiry. Nothing more can leave.' },
]

export function UseCases() {
  return (
    <section id="agents" className="container-x scroll-mt-24 pb-24 md:pb-32">
      <SectionReveal className="max-w-[760px]">
        <h2 className="text-h2 text-fg">Built for agents that spend money</h2>
        <p className="text-lead mt-6">
          Anything that can run a command can pay with Aider, from a coding agent buying API credits to a research agent paying another agent for a
          summary.
        </p>
      </SectionReveal>
      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {USES.map((u) => (
          <div key={u.title} className="flex min-h-[220px] flex-col rounded-[20px] border border-line bg-surface p-6">
            <u.icon className="size-5 text-fg-2" strokeWidth={1.6} />
            <h3 className="mt-auto text-lg font-normal text-fg">{u.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-fg-2">{u.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 max-w-[720px] text-[15px] leading-relaxed text-fg-2">
        <span className="text-fg">Agent-to-agent payments.</span> Any Aider agent can pay another agent’s address directly, with both sides inside
        their limits.{' '}
        <Button href="/docs/agent-to-agent" variant="link" className="text-fg">
          How it works
        </Button>
      </p>
    </section>
  )
}

const REQUESTS = [
  { who: 'Claude Code', memo: 'Premium dataset', amount: '1.00', left: '28 min left' },
  { who: 'research-bot', memo: 'Annual report PDF', amount: '2.50', left: '12 min left' },
  { who: 'scraper-02', memo: 'Proxy credits', amount: '0.40', left: '5 min left' },
  { who: 'summarizer', memo: 'Paid another agent', amount: '0.08', left: 'Paid' },
]

export function ApprovalsSection() {
  return (
    <section className="container-x pb-24 md:pb-32">
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel className="flex flex-col p-8 sm:p-12">
          <h2 className="text-h2 text-fg">
            Approve in
            <br />
            one click
          </h2>
          <p className="text-lead mt-6 max-w-md">
            When an agent needs more than its limit, the payment becomes a request. The money is set aside so it can’t be spent twice, and you decide.
          </p>
          <dl className="mt-auto pt-12">
            {[
              ['Agent asks for more', 'Over its per-payment or daily limit'],
              ['Funds are reserved', 'Nothing else can spend them'],
              ['You approve or reject', 'Paid at once, or released'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-6 border-t border-line py-4 text-[15px]">
                <dt className="text-fg">{k}</dt>
                <dd className="text-right text-fg-2">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-line pt-8">
            <Button href="/app/approvals">Open approvals</Button>
            <Button href="/docs/approval-requests" variant="link" className="text-fg">
              How approvals work
            </Button>
          </div>
        </Panel>
        <div className="relative overflow-hidden rounded-[28px] border border-line bg-surface p-6 sm:p-12">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_100%,rgb(var(--accent)/0.18),transparent_70%)]" />
          <div className="relative mx-auto max-w-[460px] rounded-[26px] border border-line-strong bg-surface-2/50 p-[6px]">
            <div className="rounded-[20px] border border-line bg-surface">
              <div className="flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="text-[13px] text-fg-3">Waiting for you</p>
                  <p className="mt-1 text-[15px] text-fg">3 requests · USDC</p>
                </div>
                <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-fg-3">Example</span>
              </div>
              <ul>
                {REQUESTS.map((r) => (
                  <li key={r.who} className="flex items-center gap-3 border-t border-line px-5 py-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-[13px] text-fg">
                      {r.who.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] text-fg">{r.who}</p>
                      <p className="truncate text-[13px] text-fg-3">{r.memo}</p>
                    </div>
                    <div className="text-right">
                      <p className="mono-num text-[15px] text-fg">
                        {r.amount} <span className="text-fg-3">USDC</span>
                      </p>
                      <p className={cn('text-[13px]', r.left === 'Paid' ? 'text-accent' : 'text-fg-3')}>{r.left}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-line px-5 py-4 text-[13px]">
                <span className="text-fg-2">Reserved for requests</span>
                <span className="mono-num text-fg">3.90 USDC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Developers() {
  return (
    <section id="developers" className="container-x scroll-mt-24 pb-24 md:pb-32">
      <Panel tone="outline" className="grid items-center gap-12 p-8 sm:p-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="label">For developers and agents</p>
          <h2 className="text-h2 mt-4 text-fg">Give your agent a wallet in two commands</h2>
          <p className="text-lead mt-6">
            Install the aidr CLI, point it at your wallet, and your agent can check its budget, pay, and wait for approvals. Every command prints JSON.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Button href="/docs/cli-reference">CLI reference</Button>
            <Button href="/docs/skill-md" variant="link" className="text-fg">
              SKILL.md
            </Button>
          </div>
        </div>
        <DeveloperCode />
      </Panel>
    </section>
  )
}

function FeatureRow({ title, intro, items }: { title: React.ReactNode; intro: React.ReactNode; items: { title: string; text: string; cta?: string; href?: string }[] }) {
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_2.2fr]">
      <div>
        <h2 className="text-h2 text-fg">{title}</h2>
        <div className="mt-5 max-w-sm text-[15px] leading-relaxed text-fg-2">{intro}</div>
      </div>
      <div className="grid gap-10 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="hairline-top pt-6">
            <h3 className="text-lg font-normal text-fg">{it.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-fg-2">{it.text}</p>
            {it.cta && it.href && (
              <Button href={it.href} variant="link" className="mt-6 text-fg">
                {it.cta}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function FeatureRows() {
  return (
    <section className="container-x space-y-24 pb-24 md:space-y-32 md:pb-32">
      <FeatureRow
        title={
          <>
            Limits you
            <br />
            can verify
          </>
        }
        intro="Aider is one small contract with a few clear rules. Read them, test them, check them on the explorer."
        items={[
          { title: 'Checked on every payment', text: 'Pause, revoke, expiry, recipient rules, the per-payment cap, the daily cap and the balance, every single time.', cta: 'Agent payments', href: '/docs/agent-payments' },
          { title: 'A memo on everything', text: 'Agents say why they pay. You see each memo in Activity and on every approval card.', cta: 'Watching activity', href: '/docs/watching-activity' },
          { title: 'Proof on the explorer', text: 'Every deposit, payment, approval and revoke is a USDC transaction anyone can look up.', cta: 'Contract reference', href: '/docs/contract-reference' },
        ]}
      />
      <FeatureRow
        title={
          <>
            No custody.
            <br />
            No middlemen.
          </>
        }
        intro={
          <Button href={AIDER_ADDRESS ? explorerAddress(AIDER_ADDRESS) : '/docs/contract-reference'} variant="link" className="text-fg">
            Verify the contract
          </Button>
        }
        items={[
          { title: 'Only you can withdraw', text: 'No admin key, no upgrade path. A wallet’s owner is the only address that can take funds out.' },
          { title: 'Agents can’t change the rules', text: 'An agent key can’t raise its own limits, add agents or approve its own requests.' },
          { title: 'Open source', text: 'The contract, app and CLI are public. Read the code and the tests yourself.' },
        ]}
      />
    </section>
  )
}

const FAQ = [
  ['Who holds the money?', 'Your Aider wallet lives inside the Aider contract on Arc. Only your address can withdraw from it.'],
  ['What does it run on?', 'Arc, Circle’s stablecoin chain. Payments and gas are both in USDC.'],
  ['Which agents can use it?', 'Anything that can run a terminal command: Claude Code, custom agents, scripts and bots.'],
  ['Is it audited?', 'No. Aider is an experiment built with Arc Studio. Use small amounts.'],
  ['What if my agent goes rogue?', 'It hits its limits, its bigger payments wait for you, and you can revoke it in one click.'],
]

export function Faq() {
  return (
    <section className="container-x pb-24 md:pb-32">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-h2 text-fg">Questions</h2>
        <div className="mt-10 border-b border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-t border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg text-fg [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden className="text-2xl font-light text-fg-3 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-6 pr-10 text-[15px] leading-relaxed text-fg-2">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

