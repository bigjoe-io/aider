'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Wallet } from 'lucide-react'
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMounted } from '@/lib/hooks'
import { AccountMenu } from './AccountMenu'
import { ConnectDialog } from './ConnectDialog'

export interface ConnectButtonProps {
  label?: string
  size?: ButtonSize
  variant?: ButtonVariant
  className?: string
  /** When connected, show the account menu (default) or nothing. */
  showAccount?: boolean
}

/** "Connect wallet" → wallet picker; when connected → AccountMenu. Hydration-safe. */
export function ConnectButton({ label = 'Connect wallet', size = 'md', variant = 'primary', className, showAccount = true }: ConnectButtonProps) {
  const mounted = useMounted()
  const { isConnected, isReconnecting, isConnecting } = useAccount()
  const [open, setOpen] = useState(false)

  if (!mounted || (isReconnecting && !isConnected)) {
    return <Skeleton className="h-10 w-36 rounded-full" />
  }
  if (isConnected) return showAccount ? <AccountMenu className={className} /> : null
  return (
    <>
      <Button size={size} variant={variant} className={className} icon={<Wallet className="size-4" aria-hidden />} loading={isConnecting} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ConnectDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}
