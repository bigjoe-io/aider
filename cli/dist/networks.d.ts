import { type Address, type Chain } from "viem";
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
export declare const NETWORKS: Record<NetworkName, NetworkPreset>;
/** USDC's ERC-20 interface on both Arc networks (6 decimals). Never a valid payment recipient. */
export declare const USDC_ADDRESS: Address;
/** viem chain for a network, with the RPC replaced by the configured one. */
export declare function chainFor(chainId: number, rpcUrl: string, explorerUrl: string): Chain;
export declare function networkByChainId(chainId: number): NetworkPreset | undefined;
//# sourceMappingURL=networks.d.ts.map