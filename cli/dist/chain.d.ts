import { publicActions, type Address, type PublicClient, type WalletClient, type Account } from "viem";
export declare const ERROR_SELECTORS: Record<string, string>;
export declare const LIMIT_ERRORS: Set<string>;
export interface LeashClients {
    publicClient: PublicClient;
    walletClient: WalletClient & ReturnType<typeof publicActions>;
    account: Account;
    contractAddress: Address;
    walletId: bigint;
    agentAddress: Address;
    explorerUrl: string;
}
export declare function buildClients(): LeashClients;
export declare function readWallet(clients: LeashClients): Promise<{
    balance: bigint;
    reserved: bigint;
    available: bigint;
    paused: boolean;
    mode: number;
}>;
export declare function readAgent(clients: LeashClients): Promise<{
    label: string;
    perPaymentLimit: bigint;
    dailyLimit: bigint;
    expiresAt: bigint;
    active: boolean;
    spentToday: bigint;
    dayStart: bigint;
}>;
export declare function readRequest(clients: LeashClients, requestId: bigint): Promise<{
    walletId: bigint;
    agent: string;
    to: string;
    amount: bigint;
    memo: string;
    expiresAt: bigint;
    status: number;
}>;
export declare function decodeRevertError(err: unknown): string;
export declare const USDC_DECIMALS = 6n;
export declare const USDC_SCALE: bigint;
export declare function formatUsdc(raw: bigint): string;
export declare function parseUsdc(str: string): bigint;
export declare const REQUEST_STATUS: Record<number, string>;
export declare function txUrl(explorerUrl: string, txHash: string): string;
export declare function addrUrl(explorerUrl: string, address: string): string;
//# sourceMappingURL=chain.d.ts.map