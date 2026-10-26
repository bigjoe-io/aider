'use client'

import type { ReactNode } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { AIDER_CHAIN_ID, AIDER_CHAIN_NAME } from '@/aider/config'
import { decodeAiderError } from '@/aider/errors'
import { Button, type ButtonSize } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/** "Switch to Arc Testnet" button using useSwitchChain. */
export function SwitchNetworkButton({ size = 'md', className }: { size?: ButtonSize; className?: string }) {
  const { switchChain, isPending, error } = useSwitchChain()
  return (
    <div className={cn('flex flex-col items-start gap-2', className)}>
      <Button size={size} loading={isPending} onClick={() => switchChain({ chainId: AIDER_CHAIN_ID })}>
        Switch to {AIDER_CHAIN_NAME}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {decodeAiderError(error).name === 'UserRejected'
            ? 'Switch cancelled in your wallet.'
            : `Couldn't switch automatically. Select ${AIDER_CHAIN_NAME} in your wallet.`}
        </p>
      )}
    </div>
  )
}

/**
 * Renders children only when the connected wallet is on the Aider chain. When connected to another
 * chain it shows a switch prompt (variant "card" — a centred panel — or "banner" above the children).
 * When disconnected it renders children (pair it with your own connect gate).
 */
export function NetworkGuard({ children, variant = 'card' }: { children?: ReactNode; variant?: 'card' | 'banner' }) {
  const { isConnected, chainId } = useAccount()
  const wrong = isConnected && chainId !== AIDER_CHAIN_ID
  if (!wrong) return <>{children}</>
  if (variant === 'banner') {
    return (
      <>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warn/30 bg-warn/[0.08] px-4 py-3">
          <p className="text-sm text-fg">
            Your wallet is on another network. Aider runs on <span className="font-medium">{AIDER_CHAIN_NAME}</span>.
          </p>
          <SwitchNetworkButton size="sm" />
        </div>
        {children}
      </>
    )
  }
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 rounded-[20px] border border-line bg-surface p-6 sm:p-8">
      <span className="label text-warn">Wrong network</span>
      <h2 className="text-2xl font-light tracking-[-0.02em]">Switch to {AIDER_CHAIN_NAME}</h2>
      <p className="text-fg-2">Your wallet is connected to a different network. Aider&apos;s contract lives on {AIDER_CHAIN_NAME}.</p>
      <SwitchNetworkButton />
    </div>
  )
}
