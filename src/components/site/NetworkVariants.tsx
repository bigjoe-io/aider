import type { ReactNode } from 'react'
import { AIDER_NETWORKS, NETWORKS, type NetworkConfig } from '@/aider/config'

/**
 * Renders both variants; CSS shows the one for <html data-network> (set before first paint), so
 * server-rendered pages show the visitor's network without a flash or a hydration mismatch.
 * Works in server and client components.
 */
export function ByNetwork({ testnet, mainnet }: { testnet: ReactNode; mainnet: ReactNode }) {
  return (
    <>
      <span data-net="testnet">{testnet}</span>
      <span data-net="mainnet">{mainnet}</span>
    </>
  )
}

/** Like ByNetwork, rendering `children` once per network with that network's settings. */
export function PerNetwork({ children }: { children: (net: NetworkConfig) => ReactNode }) {
  return (
    <>
      {AIDER_NETWORKS.map((n) => (
        <span key={n} data-net={n}>
          {children(NETWORKS[n])}
        </span>
      ))}
    </>
  )
}
