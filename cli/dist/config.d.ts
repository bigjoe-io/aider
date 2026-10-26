export interface LeashConfig {
    walletId: bigint | string;
    agentAddress: string;
    contractAddress: string;
    rpcUrl: string;
    chainId: number;
    explorerUrl: string;
}
export declare function saveConfig(walletId: bigint, agentAddress: string, privateKey: string, contractAddress: string, rpcUrl: string, chainId: number, explorerUrl: string): void;
export declare function loadConfig(): LeashConfig;
export declare function loadPrivateKey(): `0x${string}`;
export declare function die(msg: string): never;
//# sourceMappingURL=config.d.ts.map