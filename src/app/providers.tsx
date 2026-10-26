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

// Studio logo SVG
const StudioLogo = () => (
  <svg width="14" height="16" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 21.5001C0.167192 16.2366 1.02308 11.3243 2.45378 7.50459C4.26573 2.66517 6.88869 0 9.83904 0C12.7894 0 15.412 2.66517 17.2243 7.50459C18.1669 10.0216 18.8605 13.0121 19.2713 16.2655C19.3081 16.556 19.3393 16.8513 19.3714 17.146C19.3819 17.1642 19.3881 17.1811 19.386 17.1949C19.386 17.1949 19.6275 18.7674 19.6788 21.5001H19.6515C19.2934 21.1937 15.0694 17.7329 8.06739 18.735C8.17304 17.4996 8.31833 16.2974 8.50603 15.1452C8.51562 15.0863 8.52671 15.0294 8.53649 14.9709C11.2828 14.8846 13.6866 15.2171 15.5299 15.6529C15.5231 15.6073 15.5173 15.5603 15.5103 15.5149C15.1314 13.0547 14.5724 10.8024 13.8517 8.87761C12.6732 5.73037 11.1354 3.77496 9.83904 3.77496C8.54269 3.77496 7.00493 5.73037 5.82649 8.87761C5.54123 9.63889 5.28154 10.4508 5.04866 11.3071C4.72126 12.507 4.44621 13.7934 4.22654 15.1451C3.90141 17.1412 3.69827 19.2821 3.62345 21.5001H0Z" fill="currentColor"/>
  </svg>
)

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
