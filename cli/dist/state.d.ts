export interface AgentRecord {
    label: string;
    perPaymentLimit: bigint;
    dailyLimit: bigint;
    expiresAt: bigint;
    active: boolean;
    spentToday: bigint;
    dayStart: bigint;
}
export type AgentStatus = "active" | "revoked" | "expired" | "not_added";
/** Same test as the contract's `_agentExists`: any field ever set means the agent was added. */
export declare function agentExists(a: AgentRecord): boolean;
/** Same order as the contract's checks: never added, then revoked, then expired. */
export declare function agentStatus(a: AgentRecord, now: bigint): AgentStatus;
export declare function utcDayStart(ts: bigint): bigint;
/**
 * What the agent has spent in the current UTC day. The v1 contract returns the stored value,
 * which is stale after midnight UTC until the agent's next payment; v2 already returns the
 * effective value, and this is a no-op for it.
 */
export declare function effectiveSpentToday(a: AgentRecord, now: bigint): bigint;
export declare function remainingToday(a: AgentRecord, now: bigint): bigint;
/** Largest payment that can go through right now without approval (recipient rules aside). */
export declare function maxDirectPayment(a: AgentRecord, wallet: {
    available: bigint;
    paused: boolean;
}, now: bigint): bigint;
export declare function nextUtcMidnight(now: bigint): bigint;
/** Stored status codes: 0 PENDING, 1 APPROVED, 2 REJECTED, 3 EXPIRED. */
export declare const ONCHAIN_STATUS: readonly ["pending", "approved", "rejected", "expired"];
export type RequestStatus = (typeof ONCHAIN_STATUS)[number];
export interface RequestRecord {
    walletId: bigint;
    agent: string;
    to: string;
    amount: bigint;
    memo: string;
    expiresAt: bigint;
    status: number;
}
/** v2's getRequestState(id). Absent on v1 contracts. */
export interface RequestStateV2 {
    status: number;
    approvable: boolean;
    releasable: boolean;
}
export interface EffectiveRequest {
    /** What the request means for the agent now. A pending request the owner can no longer approve is "expired". */
    status: RequestStatus;
    /** The raw stored status. */
    onchainStatus: RequestStatus;
    /**
     * Why an expired request expired: "ttl" (its approval window passed) or "voided" (v2 only: the
     * agent that made it was revoked or its key expired, which voids its open requests).
     */
    expiredBecause: "ttl" | "voided" | null;
    /** The owner can still approve it right now. */
    approvable: boolean;
    /** Its amount is still reserved in the wallet. */
    reserved: boolean;
    /** Pending only: something other than time blocks approval (e.g. the recipient is now blocked). */
    blockedByRules: boolean;
}
export declare function onchainStatusName(code: number): RequestStatus;
export declare function effectiveRequestStatus(req: Pick<RequestRecord, "expiresAt" | "status">, now: bigint, v2?: RequestStateV2 | null): EffectiveRequest;
//# sourceMappingURL=state.d.ts.map