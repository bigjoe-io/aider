/**
 * wagmi configuration
 * Built with Arc Studio — https://studio.arc.io
 *
 * Chains: the Aider chain (Arc Testnet or Arc: the visitor's network switch), the other Arc chain,
 * and Ethereum mainnet (ENS resolution). Arc Studio's tracing is registered client-side in
 * src/app/providers.tsx — never import '@/tracing' here (this module is also evaluated on the server).
 */
import { http, createConfig, type CreateConnectorFn } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arc, arcTestnet, type Chain } from 'viem/chains'
import { injected, mock } from 'wagmi/connectors'
import { AIDER_RPC_URL, E2E_ACCOUNT, E2E_ENABLED, IS_TESTNET, NETWORKS } from '@/aider/config'

const baseAiderChain: Chain = IS_TESTNET ? arcTestnet : arc
const baseOtherChain: Chain = IS_TESTNET ? arc : arcTestnet
const otherRpcUrl = NETWORKS[IS_TESTNET ? 'mainnet' : 'testnet'].rpcUrl

/**
 * The Aider chain. With NEXT_PUBLIC_AIDER_RPC_URL set, the override becomes rpcUrls.default.http[0]:
 * wagmi's mock connector (E2E mode) posts to that URL, so it must point at the same node as the transport.
 */
export const aiderChain: Chain = AIDER_RPC_URL
  ? { ...baseAiderChain, rpcUrls: { ...baseAiderChain.rpcUrls, default: { http: [AIDER_RPC_URL] } } }
  : baseAiderChain

const otherArcChain: Chain = otherRpcUrl
  ? { ...baseOtherChain, rpcUrls: { ...baseOtherChain.rpcUrls, default: { http: [otherRpcUrl] } } }
  : baseOtherChain

export { otherArcChain }

const connectors: CreateConnectorFn[] = [injected({ shimDisconnect: true })]
if (E2E_ENABLED && E2E_ACCOUNT) {
  connectors.push(mock({ accounts: [E2E_ACCOUNT], features: { reconnect: true, defaultConnected: true } }))
}

export const config = createConfig({
  ssr: true,
  chains: [aiderChain, otherArcChain, mainnet], // mainnet needed for ENS resolution
  connectors,
  multiInjectedProviderDiscovery: true, // EIP-6963: list every installed browser wallet
  transports: {
    [aiderChain.id]: http(aiderChain.rpcUrls.default.http[0], { retryCount: 2 }),
    [otherArcChain.id]: http(otherArcChain.rpcUrls.default.http[0], { retryCount: 2 }),
    [mainnet.id]: http(), // ENS resolution uses mainnet
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
