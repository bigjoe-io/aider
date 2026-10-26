'use client'

import { useMemo } from 'react'
import { useConnect, type Connector } from 'wagmi'
import { ArrowUpRight, Wallet } from 'lucide-react'
import { AIDER_CHAIN_ID, AIDER_CHAIN_NAME } from '@/aider/config'
import { decodeAiderError } from '@/aider/errors'
import { Dialog } from '@/components/ui/Dialog'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'

function ConnectorIcon({ connector }: { connector: Connector }) {
  if (connector.icon) {
    return <img src={connector.icon} alt="" className="size-8 rounded-lg" />
  }
  return (
    <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-surface-2 text-fg-2">
      <Wallet className="size-4" aria-hidden />
    </span>
  )
}

function connectorName(c: Connector): string {
  if (c.type === 'mock') return 'Test account (E2E)'
  if (c.id === 'injected') return 'Browser wallet'
  return c.name
}

/** Wallet picker: every connector wagmi knows (EIP-6963 discovered wallets first). */
export function ConnectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connectors, connect, isPending, variables, error, reset } = useConnect()

  const list = useMemo(() => {
    const discovered = connectors.filter((c) => c.type === 'injected' && c.id !== 'injected')
    // the generic injected() connector duplicates a discovered wallet; show it only when nothing was discovered
    return connectors.filter((c) => !(c.id === 'injected' && discovered.length > 0))
  }, [connectors])

  const pendingId = isPending && variables && 'id' in variables.connector ? variables.connector.id : undefined
  const decoded = error ? decodeAiderError(error) : undefined
  const noWallet = list.length === 0 || (list.length === 1 && list[0].id === 'injected' && typeof window !== 'undefined' && !('ethereum' in window))

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Connect a wallet"
      description={`Use the account that owns (or will own) your Aider wallet on ${AIDER_CHAIN_NAME}.`}
      size="sm"
    >
      {noWallet ? (
        <div className="rounded-2xl border border-line bg-surface-2/60 p-4 text-sm leading-relaxed text-fg-2">
          <p className="font-medium text-fg">No browser wallet found</p>
          <p className="mt-1">Install a wallet extension such as MetaMask or Rabby, then reload this page.</p>
          <a
            href="https://ethereum.org/en/wallets/find-wallet/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-fg underline-offset-4 hover:underline"
          >
            Find a wallet <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((c) => {
            const busy = pendingId === c.id
            return (
              <li key={c.uid}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => connect({ connector: c, chainId: AIDER_CHAIN_ID }, { onSuccess: () => onClose() })}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border border-line bg-surface-2/50 px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-surface-2 disabled:cursor-wait disabled:opacity-60',
                    busy && 'border-accent/40 opacity-100',
                  )}
                >
                  <ConnectorIcon connector={c} />
                  <span className="flex-1 text-[15px] text-fg">{connectorName(c)}</span>
                  {busy ? (
                    <span className="inline-flex items-center gap-2 text-xs text-fg-3">
                      <Spinner className="size-3.5" /> Check your wallet
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {decoded && (
        <p role="alert" className="mt-3 rounded-xl border border-danger/25 bg-danger/[0.08] px-3 py-2 text-sm text-danger">
          {decoded.name === 'UserRejected' ? 'Connection cancelled in your wallet.' : decoded.message}
        </p>
      )}
      <p className="mt-4 text-xs leading-relaxed text-fg-3">
        Aider never asks for your private key. Agents get their own keys later — never use your owner key for an agent.
      </p>
    </Dialog>
  )
}
