import { type Address, type Hex } from "viem";
/** Saved by `aidr setup` / `aidr init` in ~/.aidr/config.json. The key lives separately in ~/.aidr/key. */
export interface AidrConfig {
    version: 1;
    network: string;
    networkName: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    contract: Address;
    deployBlock: number;
    /** Empty until the owner adds the agent (found on first use after `aidr setup`). */
    walletId: string;
    agentAddress: Address;
    /** Block `aidr setup` ran at: the owner can only have added the agent after it. */
    setupBlock?: number;
    /** The link `aidr setup` printed for the owner. */
    connectLink?: string;
}
export declare function configDir(): string;
export declare function configPath(): string;
export declare function keyPath(): string;
/** Normalises a private key ("0x" optional, 64 hex chars) or returns null. Never echoes it. */
export declare function normalizeKey(raw: string): Hex | null;
export declare function saveConfig(cfg: AidrConfig, key: Hex): void;
/** Rewrites config.json only (the key file is left alone). */
export declare function writeConfig(cfg: AidrConfig): void;
/** The saved key, if there is a valid one (used by `aidr setup` to keep the agent's identity). */
export declare function readSavedKey(): Hex | undefined;
/** The saved config, or undefined when there is none or it can't be read. */
export declare function tryLoadConfig(): AidrConfig | undefined;
export declare function loadConfig(): AidrConfig;
/** Reads the agent key saved by `aidr init` and checks it matches the configured agent address. */
export declare function loadKey(cfg: AidrConfig): Hex;
//# sourceMappingURL=config.d.ts.map