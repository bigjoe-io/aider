// Pure rules for what an agent or a request "really" is right now, mirroring the contract.
// `now` is always the chain's latest block timestamp (seconds), never the local clock.
const DAY = 86400n;
/** Same test as the contract's `_agentExists`: any field ever set means the agent was added. */
export function agentExists(a) {
    return (a.active ||
        a.dayStart !== 0n ||
        a.expiresAt !== 0n ||
        a.perPaymentLimit !== 0n ||
        a.dailyLimit !== 0n ||
        a.label.length > 0);
}
/** Same order as the contract's checks: never added, then revoked, then expired. */
export function agentStatus(a, now) {
    if (!agentExists(a))
        return "not_added";
    if (!a.active)
        return "revoked";
    if (a.expiresAt !== 0n && now > a.expiresAt)
        return "expired";
    return "active";
}
export function utcDayStart(ts) {
    return ts - (ts % DAY);
}
/**
 * What the agent has spent in the current UTC day. The v1 contract returns the stored value,
 * which is stale after midnight UTC until the agent's next payment; v2 already returns the
 * effective value, and this is a no-op for it.
 */
export function effectiveSpentToday(a, now) {
    return a.dayStart < utcDayStart(now) ? 0n : a.spentToday;
}
export function remainingToday(a, now) {
    const spent = effectiveSpentToday(a, now);
    return a.dailyLimit > spent ? a.dailyLimit - spent : 0n;
}
/** Largest payment that can go through right now without approval (recipient rules aside). */
export function maxDirectPayment(a, wallet, now) {
    if (agentStatus(a, now) !== "active" || wallet.paused)
        return 0n;
    let max = a.perPaymentLimit;
    const left = remainingToday(a, now);
    if (left < max)
        max = left;
    if (wallet.available < max)
        max = wallet.available;
    return max;
}
export function nextUtcMidnight(now) {
    return utcDayStart(now) + DAY;
}
// ── requests ─────────────────────────────────────────────────────────────────
/** Stored status codes: 0 PENDING, 1 APPROVED, 2 REJECTED, 3 EXPIRED. */
export const ONCHAIN_STATUS = ["pending", "approved", "rejected", "expired"];
export function onchainStatusName(code) {
    return ONCHAIN_STATUS[code] ?? "pending";
}
export function effectiveRequestStatus(req, now, v2) {
    const onchainStatus = onchainStatusName(req.status);
    const ttlPassed = now > req.expiresAt;
    if (onchainStatus !== "pending") {
        return {
            status: onchainStatus,
            onchainStatus,
            expiredBecause: onchainStatus === "expired" ? (ttlPassed ? "ttl" : "voided") : null,
            approvable: false,
            reserved: false,
            blockedByRules: false,
        };
    }
    if (ttlPassed) {
        return {
            status: "expired",
            onchainStatus,
            expiredBecause: "ttl",
            approvable: false,
            reserved: true,
            blockedByRules: false,
        };
    }
    if (v2 && !v2.approvable && v2.releasable) {
        // Within its TTL but releasable: the requesting agent was revoked or has expired (v2).
        return {
            status: "expired",
            onchainStatus,
            expiredBecause: "voided",
            approvable: false,
            reserved: true,
            blockedByRules: false,
        };
    }
    return {
        status: "pending",
        onchainStatus,
        expiredBecause: null,
        approvable: v2 ? v2.approvable : true,
        reserved: true,
        blockedByRules: v2 ? !v2.approvable : false,
    };
}
//# sourceMappingURL=state.js.map