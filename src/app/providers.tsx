'use client'

/*
 *  ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗
 *  ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
 *  ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║
 *  ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║
 *  ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
 *  ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝
 *
 *  Built with Arc Studio
 *  https://studio.arc.io
 */

import { useEffect, useState, type ReactNode } from 'react'
import { WagmiProvider, type State } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { hashFn } from 'wagmi/query'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'
import { arc, arcTestnet } from 'viem/chains'
import { config, aiderChain } from '@/config'
import { ThemeProvider, useTheme } from '@/lib/theme'
import { ArcMark } from '@/components/ui/ArcMark'

// Studio logo: the Arc mark
const StudioLogo = () => <ArcMark className="h-4 w-4" />

// Studio watermark component - links back to Studio
const StudioWatermark = () => (
  <a
    href="https://studio.arc.io/"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      fontSize: '12px',
      fontWeight: 600,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1B3158',
      textDecoration: 'none',
      cursor: 'pointer',
      background: 'rgba(172, 198, 233, 0.85)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(27, 49, 88, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    }}
  >
    <StudioLogo />
    Built with Arc Studio
  </a>
)

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: hashFn, // bigint-safe query keys
        staleTime: 4_000,
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  })
}

function ThemedToaster() {
  const { resolved } = useTheme()
  return (
    <Toaster
      position="top-center"
      theme={resolved}
      closeButton
      toastOptions={{
        style: {
          background: 'rgb(var(--surface))',
          border: '1px solid var(--line-strong)',
          color: 'rgb(var(--fg))',
          borderRadius: '16px',
          fontFamily: 'var(--font-geist), ui-sans-serif, system-ui, sans-serif',
        },
      }}
    />
  )
}

/** Arc Studio instrumentation touches `window` at import time: load it client-side only. */
function useArcStudioInstrumentation() {
  useEffect(() => {
    void import('@/tracing').then((m) => {
      m.registerChain(arcTestnet.id, arcTestnet.rpcUrls.default.http[0])
      m.registerChain(arc.id, arc.rpcUrls.default.http[0])
      if (aiderChain.rpcUrls.default.http[0]) m.registerChain(aiderChain.id, aiderChain.rpcUrls.default.http[0])
    })
    void import('@/console-capture')
  }, [])
}

export function Providers({ children, initialState }: { children: ReactNode; initialState?: State }) {
  const [queryClient] = useState(makeQueryClient)
  useArcStudioInstrumentation()
  return (
    <ThemeProvider>
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          <MotionConfig reducedMotion="user">
            {children}
            <StudioWatermark />
            <ThemedToaster />
          </MotionConfig>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
