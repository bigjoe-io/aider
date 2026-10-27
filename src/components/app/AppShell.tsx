'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Activity, BookOpen, Check, ChevronDown, Inbox, LayoutGrid, ListChecks, Plus, Users } from 'lucide-react'
import { Button, Card, Input, Logo, Spinner } from '@/components/ui'
import { ThemeToggle } from '@/components/site'
import { ConnectButton, SwitchNetworkButton } from '@/components/wallet'
import { AIDER_CHAIN_NAME, IS_TESTNET } from '@/aider/config'
import { useAiderReady, useAiderWrite, useMyWallets, usePendingRequests, useWallet, type WalletInfo } from '@/aider/hooks'
import { cn } from '@/lib/cn'
import { useMounted } from '@/lib/hooks'
import { parseEventLogs } from 'viem'
import { AIDER_ABI } from '@/aider/abi'

interface WalletCtx {
  walletId: bigint
  wallet: WalletInfo | undefined
  owner: `0x${string}`
}
const Ctx = createContext<WalletCtx | null>(null)

export function useSelectedWallet(): WalletCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSelectedWallet must be used inside the app shell')
  return v
}

const NAV = [
  { href: '/app', label: 'Overview', icon: LayoutGrid },
  { href: '/app/agents', label: 'Agents', icon: Users },
  { href: '/app/approvals', label: 'Approvals', icon: Inbox },
  { href: '/app/activity', label: 'Activity', icon: Activity },
  { href: '/app/rules', label: 'Rules', icon: ListChecks },
]

const storageKey = (owner: string) => `aider-wallet:${owner.toLowerCase()}`

function readSaved(owner: string): bigint | undefined {
  try {
    const v = localStorage.getItem(storageKey(owner))
    return v && /^\d+$/.test(v) ? BigInt(v) : undefined
  } catch {
    return undefined
  }
}
function save(owner: string, id: bigint) {
  try {
    localStorage.setItem(storageKey(owner), id.toString())
  } catch {
    /* storage unavailable */
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const mounted = useMounted()
  const { gate, address } = useAiderReady()
  const { wallets, isLoading } = useMyWallets(gate === 'ready' ? address : undefined)
  // The wallet the owner picked (per address); otherwise the saved one, otherwise their first.
  const [chosen, setChosen] = useState<{ owner: string; id: bigint } | undefined>()
  const selected = useMemo(() => {
    if (!address) return undefined
    if (chosen && chosen.owner === address.toLowerCase()) return chosen.id
    const saved = readSaved(address)
    if (saved !== undefined && wallets.some((w) => w.id === saved)) return saved
    return wallets[0]?.id
  }, [address, chosen, wallets])

  const choose = (id: bigint) => {
    if (!address) return
    setChosen({ owner: address.toLowerCase(), id })
    save(address, id)
  }

  const { wallet } = useWallet(selected)

  let body: ReactNode
  if (!mounted) body = <Centered><Spinner /></Centered>
  else if (gate === 'no-contract') body = <NoContract />
  else if (gate === 'disconnected') body = <Disconnected />
  else if (gate === 'wrong-chain') body = <WrongChain />
  else if (isLoading && wallets.length === 0) body = <Centered><Spinner /></Centered>
  else if (wallets.length === 0 || selected === undefined || !address) body = <NoWallets onCreated={choose} />
  else body = <Ctx.Provider value={{ walletId: selected, wallet, owner: address }}>{children}</Ctx.Provider>

  const ready = mounted && gate === 'ready' && selected !== undefined

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex h-16 max-w-[1360px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <Logo href="/" />
          <span className="hidden h-5 w-px bg-line sm:block" />
          {ready && <WalletPicker wallets={wallets} selected={selected} onSelect={choose} />}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-2 md:inline-flex">
              <span className={cn('size-1.5 rounded-full', IS_TESTNET ? 'bg-warn' : 'bg-accent')} />
              {AIDER_CHAIN_NAME}
            </span>
            <ThemeToggle className="hidden sm:inline-flex" />
            <ConnectButton size="sm" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1360px] gap-8 px-4 pb-24 sm:px-6 lg:pb-12">
        <aside className="sticky top-16 hidden h-[calc(100dvh-64px)] w-56 shrink-0 flex-col py-8 lg:flex">
          <SideNav />
          <div className="mt-auto space-y-1 border-t border-line pt-4 text-sm">
            <Link href="/docs" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-fg-2 hover:bg-surface-2/60 hover:text-fg">
              <BookOpen className="size-4" /> Docs
            </Link>
            <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-fg-2 hover:bg-surface-2/60 hover:text-fg">
              ← Back to site
            </Link>
          </div>
        </aside>
        <main id="main" className="min-w-0 flex-1 py-8 lg:py-10">
          {body}
        </main>
      </div>

      <nav aria-label="App sections" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-bg/95 backdrop-blur lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <MobileNav />
      </nav>
    </div>
  )
}

function usePendingCount(): number {
  const ctx = useContext(Ctx)
  const { requests } = usePendingRequests(ctx?.walletId)
  return requests.filter((r) => !r.isPastTtl).length
}

function SideNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="App sections" className="space-y-1">
      {NAV.map((n) => {
        const active = pathname === n.href
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2 text-[15px] transition-colors', active ? 'bg-surface-2 text-fg' : 'text-fg-2 hover:bg-surface-2/60 hover:text-fg')}
          >
            <n.icon className="size-4" />
            {n.label}
            {n.label === 'Approvals' && <PendingBadge />}
          </Link>
        )
      })}
    </nav>
  )
}

function PendingBadge() {
  const ctx = useContext(Ctx)
  return ctx ? <PendingBadgeInner /> : null
}
function PendingBadgeInner() {
  const n = usePendingCount()
  if (n === 0) return null
  return <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-ink">{n}</span>
}

function MobileNav() {
  const pathname = usePathname()
  return (
    <>
      {NAV.map((n) => {
        const active = pathname === n.href
        return (
          <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined} className={cn('flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]', active ? 'text-fg' : 'text-fg-3')}>
            <n.icon className="size-[18px]" />
            {n.label}
          </Link>
        )
      })}
    </>
  )
}

function WalletPicker({ wallets, selected, onSelect }: { wallets: WalletInfo[]; selected: bigint | undefined; onSelect: (id: bigint) => void }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-fg hover:border-line-strong"
      >
        <span className="hidden sm:inline">Wallet</span> <span className="mono-num">#{selected?.toString()}</span>
        <ChevronDown className="size-3.5 text-fg-3" />
      </button>
      {open && (
        <ul role="listbox" aria-label="Your wallets" className="absolute left-0 top-11 z-50 min-w-48 rounded-2xl border border-line bg-surface p-1.5 shadow-2xl">
          {wallets.map((w) => (
            <li key={w.id.toString()} role="option" aria-selected={w.id === selected}>
              <button type="button" onClick={() => onSelect(w.id)} className="flex w-full items-center justify-between gap-6 rounded-xl px-3 py-2 text-left text-sm text-fg hover:bg-surface-2">
                <span className="mono-num">Wallet #{w.id.toString()}</span>
                {w.id === selected && <Check className="size-4 text-accent" />}
              </button>
            </li>
          ))}
          <li className="mt-1 border-t border-line pt-1">
            <CreateWalletButton variant="menu" onCreated={onSelect} />
          </li>
        </ul>
      )}
    </div>
  )
}

function CreateWalletButton({ onCreated, variant = 'primary' }: { onCreated: (id: bigint) => void; variant?: 'primary' | 'menu' }) {
  const { write, isPending } = useAiderWrite()
  const create = async () => {
    const res = await write('createWallet', [], { pending: 'Creating your wallet…', success: 'Wallet created' })
    if (!res.ok) return
    const created = parseEventLogs({ abi: AIDER_ABI, logs: res.receipt.logs, eventName: 'WalletCreated' })[0]
    if (created) onCreated(created.args.walletId)
  }
  if (variant === 'menu')
    return (
      <button type="button" onClick={() => void create()} disabled={isPending} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-fg-2 hover:bg-surface-2 hover:text-fg disabled:opacity-50">
        <Plus className="size-4" /> Create wallet
      </button>
    )
  return (
    <Button size="lg" onClick={() => void create()} loading={isPending}>
      Create wallet
    </Button>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="grid min-h-[50vh] place-items-center">{children}</div>
}

function GateCard({ title, text, children }: { title: string; text: ReactNode; children?: ReactNode }) {
  return (
    <Card className="glow-hero mx-auto max-w-2xl px-8 py-14 text-center sm:px-14">
      <h1 className="text-[clamp(1.75rem,3vw,2.4rem)] font-light tracking-[-0.03em] text-fg">{title}</h1>
      <div className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-fg-2">{text}</div>
      {children && <div className="mt-8 flex flex-col items-center gap-4">{children}</div>}
    </Card>
  )
}

function Disconnected() {
  return (
    <GateCard title="Connect a wallet to manage your agents" text="Your browser wallet is the owner of your Aider wallet. Agents get their own keys later.">
      <ConnectButton size="lg" />
      <Button href="/docs/quickstart" variant="link" className="text-fg">
        New here? Read the quickstart
      </Button>
    </GateCard>
  )
}

function WrongChain() {
  return (
    <GateCard title={`Switch to ${AIDER_CHAIN_NAME}`} text={`Aider runs on ${AIDER_CHAIN_NAME}. Your wallet is connected to a different network.`}>
      <SwitchNetworkButton size="lg" />
    </GateCard>
  )
}

function NoContract() {
  return (
    <GateCard
      title="Aider isn’t deployed on this network yet"
      text={
        <>
          Set <code className="font-mono text-fg">NEXT_PUBLIC_AIDER_CONTRACT</code> (and <code className="font-mono text-fg">NEXT_PUBLIC_AIDER_DEPLOY_BLOCK</code>) to the
          deployed contract for {AIDER_CHAIN_NAME}, then restart the app.
        </>
      }
    />
  )
}

function NoWallets({ onCreated }: { onCreated: (id: bigint) => void }) {
  const [id, setId] = useState('')
  const valid = useMemo(() => /^\d+$/.test(id.trim()) && id.trim() !== '0', [id])
  return (
    <GateCard title="Create your first Aider wallet" text="A wallet holds the USDC your agents can spend. You’ll be its owner; only you can withdraw.">
      <CreateWalletButton onCreated={onCreated} />
      <form
        className="mt-4 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onCreated(BigInt(id.trim()))
        }}
      >
        <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="Wallet id" aria-label="Open an existing wallet by id" className="w-36" inputMode="numeric" />
        <Button type="submit" variant="secondary" disabled={!valid}>
          Open wallet
        </Button>
      </form>
    </GateCard>
  )
}
