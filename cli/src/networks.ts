import { arc, arcTestnet } from "viem/chains";
import { defineChain, type Address, type Chain } from "viem";

export type NetworkName = "testnet" | "mainnet";

export interface NetworkPreset {
  name: NetworkName;
  /** Human name, as Arc Studio's onchain facts spell it. */
  label: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  /** Default Aider deployment. Mainnet has none yet, so `--contract` is required there. */
  defaultContract?: Address;
  /** Block the default deployment was created in (history never scans below it). */
  defaultDeployBlock?: number;
}

export const NETWORKS: Record<NetworkName, NetworkPreset> = {
  testnet: {
    name: "testnet",
    label: "Arc Testnet",
    chainId: 5042002,
    rpcUrl: "https://rpc.testnet.arc.io",
    explorerUrl: "https://explorer.testnet.arc.io",
    defaultContract: "0xed32e15d81e7864bf19caea4333bd0781f328ba3",
    defaultDeployBlock: 69187895,
  },
  mainnet: {
    name: "mainnet",
    label: "Arc",
    chainId: 5042,
    rpcUrl: "https://rpc.mainnet.arc.io",
    explorerUrl: "https://explorer.arc.io",
  },
};

/** USDC's ERC-20 interface on both Arc networks (6 decimals). Never a valid payment recipient. */
export const USDC_ADDRESS: Address = "0x3600000000000000000000000000000000000000";

/** viem chain for a network, with the RPC replaced by the configured one. */
export function chainFor(chainId: number, rpcUrl: string, explorerUrl: string): Chain {
  const base: Chain =
    chainId === arcTestnet.id
      ? arcTestnet
      : chainId === arc.id
        ? arc
        : defineChain({
            id: chainId,
            name: `Chain ${chainId}`,
            nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
            rpcUrls: { default: { http: [rpcUrl] } },
            blockExplorers: { default: { name: "Explorer", url: explorerUrl } },
          });
  return { ...base, rpcUrls: { default: { http: [rpcUrl] } } };
}

export function networkByChainId(chainId: number): NetworkPreset | undefined {
  return Object.values(NETWORKS).find((n) => n.chainId === chainId);
}
