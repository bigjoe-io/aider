/**
 * Aider network / contract configuration, read from NEXT_PUBLIC_AIDER_* env vars at build time.
 * Safe to import from server and client code.
 *
 * Both Arc networks are configured side by side (NETWORKS). The *active* one is chosen per visitor
 * with the network switch: it is stored in localStorage and copied to <html data-network> by
 * NETWORK_INIT_SCRIPT before any of our JS runs, so on the client the ACTIVE_* exports below match
 * the visitor's choice. Switching reloads the page. On the server they are the default network,
 * so server-rendered text that depends on the network must render both variants (<ByNetwork>).
 */
import { getAddress, isAddress, type Address } from 'viem'
import { buildAddressExplorerUrl, buildTxExplorerUrl, getUsdc, requireChain } from '@/onchain-facts'

export type AiderNetwork = 'testnet' | 'mainnet'
export const AIDER_NETWORKS: readonly AiderNetwork[] = ['testnet', 'mainnet']

export const TESTNET_CHAIN_ID = 5042002
export const MAINNET_CHAIN_ID = 5042

/** Public default deployment on Arc Testnet. */
export const DEFAULT_TESTNET_CONTRACT: Address = '0xed32e15d81e7864bf19caea4333bd0781f328ba3'
export const DEFAULT_TESTNET_DEPLOY_BLOCK = 69187895n
/** Public default deployment on Arc mainnet (v2). */
export const DEFAULT_MAINNET_CONTRACT: Address = '0xaeb8bf4852d4a6ad0fe75d488b418cae664653e9'
export const DEFAULT_MAINNET_DEPLOY_BLOCK = 28199868n

// NOTE: each env var must be referenced literally (process.env.NEXT_PUBLIC_X) so Next can inline it.
const rawNetwork = (process.env.NEXT_PUBLIC_AIDER_NETWORK ?? '').trim().toLowerCase()
// Legacy single-network variables: they apply to the default network.
const rawContract = (process.env.NEXT_PUBLIC_AIDER_CONTRACT ?? '').trim()
const rawDeployBlock = (process.env.NEXT_PUBLIC_AIDER_DEPLOY_BLOCK ?? '').trim()
const rawRpc = (process.env.NEXT_PUBLIC_AIDER_RPC_URL ?? '').trim()
const raw = {
  testnet: {
    contract: (process.env.NEXT_PUBLIC_AIDER_TESTNET_CONTRACT ?? '').trim(),
    deployBlock: (process.env.NEXT_PUBLIC_AIDER_TESTNET_DEPLOY_BLOCK ?? '').trim(),
    rpc: (process.env.NEXT_PUBLIC_AIDER_TESTNET_RPC_URL ?? '').trim(),
  },
  mainnet: {
    contract: (process.env.NEXT_PUBLIC_AIDER_MAINNET_CONTRACT ?? '').trim(),
    deployBlock: (process.env.NEXT_PUBLIC_AIDER_MAINNET_DEPLOY_BLOCK ?? '').trim(),
    rpc: (process.env.NEXT_PUBLIC_AIDER_MAINNET_RPC_URL ?? '').trim(),
  },
}
const rawGithub = (process.env.NEXT_PUBLIC_AIDER_GITHUB_URL ?? '').trim()
const rawX = (process.env.NEXT_PUBLIC_AIDER_X_URL ?? '').trim()

/** The network a visitor sees until they switch. */
export const DEFAULT_NETWORK: AiderNetwork = rawNetwork === 'mainnet' ? 'mainnet' : 'testnet'

export interface NetworkConfig {
  network: AiderNetwork
  chainId: number
  /** Human chain name from Arc Studio's facts: "Arc Testnet" | "Arc". */
  chainName: string
  /** Short label for the switch. */
  label: string
  /** Unambiguous name for text: "Arc Testnet" | "Arc mainnet". */
  displayName: string
  explorerBase: string
  /** The Aider contract, or undefined when it isn't deployed on this network yet. */
  contract: Address | undefined
  /** True when `contract` is the network's public default deployment (the CLI needs no --contract). */
  isDefaultDeployment: boolean
  /** First block the activity indexer scans. */
  deployBlock: bigint
  /** Optional RPC override. */
  rpcUrl: string | undefined
  /** ERC-20 USDC (6 decimals). Never mix with the 18-decimal gas token. */
  usdc: Address
  isTestnet: boolean
}

function parseContract(value: string, name: string): Address | undefined {
  if (!value) return undefined
  if (isAddress(value, { strict: false })) return getAddress(value)
  if (process.env.NODE_ENV !== 'production') console.warn(`[aider] ${name} is not a valid address: ${value}`)
  return undefined
}

function buildNetwork(network: AiderNetwork): NetworkConfig {
  const isTestnet = network === 'testnet'
  const chainId = isTestnet ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID
  const isDefault = network === DEFAULT_NETWORK
  const r = raw[network]
  const upper = network.toUpperCase()
  const contract =
    parseContract(r.contract, `NEXT_PUBLIC_AIDER_${upper}_CONTRACT`) ??
    (isDefault ? parseContract(rawContract, 'NEXT_PUBLIC_AIDER_CONTRACT') : undefined) ??
    getAddress(isTestnet ? DEFAULT_TESTNET_CONTRACT : DEFAULT_MAINNET_CONTRACT)
  const defaultContract = isTestnet ? DEFAULT_TESTNET_CONTRACT : DEFAULT_MAINNET_CONTRACT
  const isDefaultDeployment = contract.toLowerCase() === defaultContract.toLowerCase()
  const blockRaw = r.deployBlock || (isDefault ? rawDeployBlock : '')
  const defaultBlock = isTestnet ? DEFAULT_TESTNET_DEPLOY_BLOCK : DEFAULT_MAINNET_DEPLOY_BLOCK
  const deployBlock = /^\d+$/.test(blockRaw) ? BigInt(blockRaw) : isDefaultDeployment ? defaultBlock : 0n
  const fact = requireChain(chainId)
  return {
    network,
    chainId,
    chainName: fact.name,
    label: isTestnet ? 'Testnet' : 'Mainnet',
    displayName: isTestnet ? 'Arc Testnet' : 'Arc mainnet',
    explorerBase: fact.explorerBase,
    contract,
    isDefaultDeployment,
    deployBlock,
    rpcUrl: r.rpc || (isDefault ? rawRpc : '') || undefined,
    usdc: getAddress(getUsdc(chainId)?.address ?? '0x3600000000000000000000000000000000000000'),
    isTestnet,
  }
}

export const NETWORKS: Record<AiderNetwork, NetworkConfig> = {
  testnet: buildNetwork('testnet'),
  mainnet: buildNetwork('mainnet'),
}

export const NETWORK_STORAGE_KEY = 'aider-network'

function isNetwork(v: unknown): v is AiderNetwork {
  return v === 'testnet' || v === 'mainnet'
}

/**
 * Inline <head> script (static string, our own code): copies the saved network to <html data-network>
 * before first paint, so CSS can show the right variant and the bundles below can read it.
 */
export const NETWORK_INIT_SCRIPT = `(function(){try{var n=localStorage.getItem('${NETWORK_STORAGE_KEY}');if(n!=='testnet'&&n!=='mainnet')n='${DEFAULT_NETWORK}';document.documentElement.setAttribute('data-network',n);}catch(e){}})();`

function activeNetwork(): AiderNetwork {
  if (typeof document === 'undefined') return DEFAULT_NETWORK
  const v = document.documentElement.getAttribute('data-network')
  return isNetwork(v) ? v : DEFAULT_NETWORK
}

/** The network this page view uses (the visitor's choice in the browser; the default on the server). */
export const AIDER_NETWORK: AiderNetwork = activeNetwork()
export const ACTIVE: NetworkConfig = NETWORKS[AIDER_NETWORK]
export const IS_TESTNET = ACTIVE.isTestnet
export const AIDER_CHAIN_ID: number = ACTIVE.chainId
/** The other Arc chain (mainnet when we run on testnet and vice versa). */
export const OTHER_ARC_CHAIN_ID: number = IS_TESTNET ? MAINNET_CHAIN_ID : TESTNET_CHAIN_ID
export const AIDER_CHAIN_NAME = ACTIVE.chainName
export const EXPLORER_BASE = ACTIVE.explorerBase
/** The Aider contract on the active network, or undefined when it isn't deployed there yet. */
export const AIDER_ADDRESS: Address | undefined = ACTIVE.contract
/** True when AIDER_ADDRESS is the public default testnet deployment. */
export const IS_DEFAULT_DEPLOYMENT = ACTIVE.isDefaultDeployment
/** First block the indexer scans. */
export const AIDER_DEPLOY_BLOCK: bigint = ACTIVE.deployBlock
/** Optional RPC override for the Aider chain transport. */
export const AIDER_RPC_URL: string | undefined = ACTIVE.rpcUrl
/** ERC-20 USDC on the Aider chain (6 decimals). Never mix with the 18-decimal gas token. */
export const USDC_ADDRESS: Address = ACTIVE.usdc

/** Saves the visitor's network and reloads, so every module picks it up. */
export function switchNetwork(network: AiderNetwork): void {
  if (network === AIDER_NETWORK) return
  try {
    window.localStorage.setItem(NETWORK_STORAGE_KEY, network)
  } catch {
    // storage blocked: nothing to persist, so the switch can't survive the reload
    return
  }
  window.location.reload()
}

export const GITHUB_URL = rawGithub || 'https://github.com/bigjoe-io/aider'
export const X_URL: string | undefined = rawX || undefined
export const ARC_STUDIO_URL = 'https://studio.arc.io/'

/** Dev-only end-to-end test mode (mock connector). Never true in production builds. */
export const E2E_ENABLED = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_AIDER_E2E === '1'
const rawE2eAccount = (process.env.NEXT_PUBLIC_AIDER_E2E_ACCOUNT ?? '').trim()
export const E2E_ACCOUNT: Address | undefined =
  E2E_ENABLED && isAddress(rawE2eAccount, { strict: false }) ? getAddress(rawE2eAccount) : undefined

export function explorerTx(hash: string, chainId: number = AIDER_CHAIN_ID): string {
  return buildTxExplorerUrl(chainId, hash)
}

export function explorerAddress(address: string, chainId: number = AIDER_CHAIN_ID): string {
  return buildAddressExplorerUrl(chainId, address)
}

export function explorerBlock(block: bigint | number): string {
  return `${EXPLORER_BASE}/block/${block.toString()}`
}
