/**
 * Aider network / contract configuration, read from NEXT_PUBLIC_AIDER_* env vars at build time.
 * Safe to import from server and client code.
 */
import { getAddress, isAddress, type Address } from 'viem'
import { buildAddressExplorerUrl, buildTxExplorerUrl, getUsdc, requireChain } from '@/onchain-facts'

export type AiderNetwork = 'testnet' | 'mainnet'

export const TESTNET_CHAIN_ID = 5042002
export const MAINNET_CHAIN_ID = 5042

/** Public default deployment on Arc Testnet. */
export const DEFAULT_TESTNET_CONTRACT: Address = '0xed32e15d81e7864bf19caea4333bd0781f328ba3'
export const DEFAULT_TESTNET_DEPLOY_BLOCK = 69187895n

// NOTE: each env var must be referenced literally (process.env.NEXT_PUBLIC_X) so Next can inline it.
const rawNetwork = (process.env.NEXT_PUBLIC_AIDER_NETWORK ?? '').trim().toLowerCase()
const rawContract = (process.env.NEXT_PUBLIC_AIDER_CONTRACT ?? '').trim()
const rawDeployBlock = (process.env.NEXT_PUBLIC_AIDER_DEPLOY_BLOCK ?? '').trim()
const rawRpc = (process.env.NEXT_PUBLIC_AIDER_RPC_URL ?? '').trim()
const rawGithub = (process.env.NEXT_PUBLIC_AIDER_GITHUB_URL ?? '').trim()
const rawX = (process.env.NEXT_PUBLIC_AIDER_X_URL ?? '').trim()

export const AIDER_NETWORK: AiderNetwork = rawNetwork === 'mainnet' ? 'mainnet' : 'testnet'
export const IS_TESTNET = AIDER_NETWORK === 'testnet'
export const AIDER_CHAIN_ID: number = IS_TESTNET ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID
/** The other Arc chain (mainnet when we run on testnet and vice versa). */
export const OTHER_ARC_CHAIN_ID: number = IS_TESTNET ? MAINNET_CHAIN_ID : TESTNET_CHAIN_ID

const chainFact = requireChain(AIDER_CHAIN_ID)
/** Human chain name from Arc Studio's facts: "Arc Testnet" | "Arc". */
export const AIDER_CHAIN_NAME = chainFact.name
export const EXPLORER_BASE = chainFact.explorerBase

function resolveContract(): Address | undefined {
  if (rawContract) {
    if (isAddress(rawContract, { strict: false })) return getAddress(rawContract)
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[aider] NEXT_PUBLIC_AIDER_CONTRACT is not a valid address: ${rawContract}`)
    }
    return undefined
  }
  return IS_TESTNET ? getAddress(DEFAULT_TESTNET_CONTRACT) : undefined
}

/** The Aider contract on the configured network, or undefined when it isn't deployed / configured. */
export const AIDER_ADDRESS: Address | undefined = resolveContract()

/** True when AIDER_ADDRESS is the public default testnet deployment. */
export const IS_DEFAULT_DEPLOYMENT =
  AIDER_ADDRESS !== undefined && IS_TESTNET && AIDER_ADDRESS.toLowerCase() === DEFAULT_TESTNET_CONTRACT.toLowerCase()

function resolveDeployBlock(): bigint {
  if (rawDeployBlock && /^\d+$/.test(rawDeployBlock)) return BigInt(rawDeployBlock)
  if (IS_DEFAULT_DEPLOYMENT) return DEFAULT_TESTNET_DEPLOY_BLOCK
  if (AIDER_ADDRESS && typeof window !== 'undefined') {
    console.warn('[aider] NEXT_PUBLIC_AIDER_DEPLOY_BLOCK is not set: the activity indexer scans from block 0, which is slow.')
  }
  return 0n
}

/** First block the indexer scans. */
export const AIDER_DEPLOY_BLOCK: bigint = resolveDeployBlock()

/** Optional RPC override for the Aider chain transport. */
export const AIDER_RPC_URL: string | undefined = rawRpc || undefined

/** ERC-20 USDC on the Aider chain (6 decimals). Never mix with the 18-decimal gas token. */
export const USDC_ADDRESS: Address = getAddress(getUsdc(AIDER_CHAIN_ID)?.address ?? '0x3600000000000000000000000000000000000000')

export const GITHUB_URL = rawGithub || 'https://github.com/bigjoe-io/aider'
export const X_URL: string | undefined = rawX || undefined
export const ARC_STUDIO_URL = 'https://studio.arc.io/'

/** Dev-only end-to-end test mode (mock connector). Never true in production builds. */
export const E2E_ENABLED = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_AIDER_E2E === '1'
const rawE2eAccount = (process.env.NEXT_PUBLIC_AIDER_E2E_ACCOUNT ?? '').trim()
export const E2E_ACCOUNT: Address | undefined =
  E2E_ENABLED && isAddress(rawE2eAccount, { strict: false }) ? getAddress(rawE2eAccount) : undefined

export function explorerTx(hash: string): string {
  return buildTxExplorerUrl(AIDER_CHAIN_ID, hash)
}

export function explorerAddress(address: string): string {
  return buildAddressExplorerUrl(AIDER_CHAIN_ID, address)
}

export function explorerBlock(block: bigint | number): string {
  return `${EXPLORER_BASE}/block/${block.toString()}`
}
