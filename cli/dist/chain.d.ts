import { type Account, type Address, type Chain, type PublicClient, type Transport, type WalletClient } from "viem";
import { type AidrConfig } from "./config.js";
import type { AgentRecord, RequestRecord, RequestStateV2 } from "./state.js";
export interface Ctx {
    cfg: AidrConfig;
    chain: Chain;
    publicClient: PublicClient<Transport, Chain>;
    contract: Address;
    walletId: bigint;
    agentAddress: Address;
}
export interface SignerCtx extends Ctx {
    account: Account;
    walletClient: WalletClient<Transport, Chain, Account>;
}
export declare function makePublicClient(chain: Chain, rpcUrl: string): PublicClient<Transport, Chain>;
/** Read-only context from ~/.aidr/config.json (no key needed). */
export declare function loadContext(): Promise<Ctx>;
/**
 * After `aidr setup`, the agent doesn't know its wallet id yet: find the wallet whose owner added
 * this agent (AgentAdded events since setup) and where it is still active.
 */
export declare function findWallet(cfg: AidrConfig, publicClient: PublicClient<Transport, Chain>): Promise<bigint>;
/** Context that can sign as the agent (loads ~/.aidr/key). */
export declare function loadSignerContext(): Promise<SignerCtx>;
export declare function txUrl(cfg: Pick<AidrConfig, "explorerUrl">, hash: string): string;
export declare function addressUrl(cfg: Pick<AidrConfig, "explorerUrl">, address: string): string;
/** Wraps RPC/contract failures of read calls into friendly CliErrors. */
export declare function rpc<T>(ctx: Pick<Ctx, "cfg">, fn: () => Promise<T>): Promise<T>;
/** Latest block timestamp: the contract's notion of "now". */
export declare function chainNow(publicClient: PublicClient<Transport, Chain>): Promise<bigint>;
export interface WalletRecord {
    owner: Address;
    balance: bigint;
    reserved: bigint;
    available: bigint;
    paused: boolean;
    mode: number;
}
export declare function readWallet(publicClient: PublicClient<Transport, Chain>, contract: Address, walletId: bigint): Promise<WalletRecord>;
export declare function readAgent(publicClient: PublicClient<Transport, Chain>, contract: Address, walletId: bigint, agent: Address): Promise<AgentRecord>;
export declare function readRequest(publicClient: PublicClient<Transport, Chain>, contract: Address, requestId: bigint): Promise<RequestRecord>;
/**
 * v2's getRequestState(id). Returns null on a v1 contract (the function doesn't exist there and
 * the call reverts without data) or when the request doesn't exist. RPC failures are rethrown.
 */
export declare function readRequestStateV2(publicClient: PublicClient<Transport, Chain>, contract: Address, requestId: bigint): Promise<RequestStateV2 | null>;
/** Detects the v2 contract by calling MAX_REQUEST_TTL() (missing on v1). */
export declare function detectVersion(publicClient: PublicClient<Transport, Chain>, contract: Address): Promise<"v1" | "v2">;
//# sourceMappingURL=chain.d.ts.map