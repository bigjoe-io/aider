import { type AgentRecord } from "./state.js";
/**
 * A failure the CLI reports as {"status":"error","error":code,"message","hint", ...extra} with
 * exit code 1. `code` is the contract's error name when the contract rejected something.
 */
export declare class CliError extends Error {
    readonly code: string;
    readonly hint: string;
    readonly extra: Record<string, unknown>;
    constructor(code: string, message: string, hint: string, extra?: Record<string, unknown>);
}
export type DecodedKind = "contract" | "require" | "panic" | "unknown_contract_error" | "reverted" | "no_code" | "rpc" | "gas_funds" | "nonce" | "chain" | "receipt_timeout" | "other";
export interface DecodedError {
    /** Contract error name, require string, or a CLI code such as RpcError. */
    name: string;
    kind: DecodedKind;
    /** Short technical detail (panic reason, selector, RPC message). */
    detail?: string;
}
/** True when the contract (not the RPC or the client) rejected the call. */
export declare function isContractRejection(d: DecodedError): boolean;
/** Decodes any error thrown by viem (simulate/read/write/wait) using the full Aider ABI. */
export declare function decodeError(err: unknown): DecodedError;
export interface ErrorContext {
    amount?: bigint;
    to?: string;
    walletId?: bigint;
    agentAddress?: string;
    agent?: AgentRecord;
    wallet?: {
        available: bigint;
        paused: boolean;
    };
    /** Chain time (seconds). */
    now?: bigint;
    ttlMinutes?: number;
    rpcUrl?: string;
    requestId?: bigint;
    /** Set when the payment went over a limit and the fallback approval request failed. */
    duringRequest?: boolean;
}
export interface Explanation {
    message: string;
    hint: string;
}
/** Every error name the CLI explains specifically (all contract errors and require strings). */
export declare const EXPLAINED_ERRORS: readonly ["NotWalletOwner", "WalletPaused", "AgentNotActive", "AgentRevokedError", "AgentExpired", "RecipientNotAllowed", "RecipientBlocked", "OverPerPaymentLimit", "OverDailyLimit", "InsufficientBalance", "RequestNotPending", "RequestExpiredError", "ZeroAmount", "ZeroAddress", "InvalidTTL", "RequestNotExpiredYet", "RequestNotFound", "InvalidRecipient", "OwnerCannotBeAgent", "InvalidExpiry", "TooManyOpenRequests", "ReentrancyGuardReentrantCall", "WALLET_NOT_FOUND", "USDC_TRANSFER_FROM_FAILED", "USDC_TRANSFER_FAILED", "Panic", "UnknownContractError", "ExecutionReverted", "TransactionReverted", "NoContractCode", "InsufficientGasFunds", "NonceConflict", "ChainMismatch", "ReceiptTimeout", "RpcError"];
/** Turns an error name into a plain-language message and what to do next. */
export declare function explainError(d: DecodedError, ctx?: ErrorContext): Explanation;
/** The CliError for a decoded failure, with a friendly message and hint. */
export declare function toCliError(d: DecodedError, ctx?: ErrorContext, extra?: Record<string, unknown>): CliError;
/** Agent status wording shared by balance and init. */
export declare function agentStatusNote(a: AgentRecord, now: bigint, agentAddress: string, walletId: bigint): string | null;
//# sourceMappingURL=errors.d.ts.map