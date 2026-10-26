import { type Address, type Hex } from "viem";
/** Saved by `aidr init` in ~/.aidr/config.json. The key lives separately in ~/.aidr/key. */
export interface AidrConfig {
    version: 1;
    network: string;
    networkName: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    contract: Address;
    deployBlock: number;
    walletId: string;
    agentAddress: Address;
}
export declare function configDir(): string;
export declare function configPath(): string;
export declare function keyPath(): string;
/** Normalises a private key ("0x" optional, 64 hex chars) or returns null. Never echoes it. */
export declare function normalizeKey(raw: string): Hex | null;
export declare function saveConfig(cfg: AidrConfig, key: Hex): void;
export declare function loadConfig(): AidrConfig;
/** Reads the agent key saved by `aidr init` and checks it matches the configured agent address. */
export declare function loadKey(cfg: AidrConfig): Hex;
//# sourceMappingURL=config.d.ts.map