import { zeroAddress } from "viem";
import { formatUsdc, usd } from "./amount.js";
import { chainNow, readRequest, readRequestStateV2, rpc } from "./chain.js";
import { CliError, toCliError } from "./errors.js";
import { effectiveRequestStatus } from "./state.js";
export function parseRequestId(raw) {
    const v = raw.trim();
    if (!/^\d+$/.test(v)) {
        throw new CliError("InvalidRequestId", `"${raw}" is not a request id.`, "Use the requestId printed by `aidr pay` (a whole number such as 7).");
    }
    return BigInt(v);
}
function iso(ts) {
    return new Date(Number(ts) * 1000).toISOString();
}
export function duration(seconds) {
    const s = Number(seconds < 0n ? 0n : seconds);
    if (s < 60)
        return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60)
        return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 48)
        return `${h} h ${m % 60} min`;
    return `${Math.floor(h / 24)} days ${h % 24} h`;
}
function noteFor(e, r, id, now) {
    switch (e.status) {
        case "approved":
            return `The owner approved it: ${usd(r.amount)} was paid to ${r.to}.`;
        case "rejected":
            return "The owner rejected it. Nothing was paid and the reserved amount was released.";
        case "expired": {
            const why = e.expiredBecause === "voided"
                ? "The agent that made it was revoked or its key expired, so the owner can no longer approve it."
                : `Its approval window closed at ${iso(r.expiresAt)}, so the owner can no longer approve it.`;
            return e.reserved
                ? `${why} Nothing was paid. Its ${usd(r.amount)} stays reserved until someone releases it: anyone can call expireRequest(${id}) on the contract.`
                : `${why} Nothing was paid and the reserved amount has been released.`;
        }
        default:
            return e.blockedByRules
                ? `Waiting for the owner, but it can't be approved right now: the wallet's recipient rules don't permit ${r.to}. The owner has until ${iso(r.expiresAt)} (${duration(r.expiresAt - now)} left).`
                : `Waiting for the owner to approve or reject it. They have until ${iso(r.expiresAt)} (${duration(r.expiresAt - now)} left).`;
    }
}
/** Reads a request and works out what it means now: expired once its TTL passes, or once voided (v2). */
export async function loadRequestView(ctx, id) {
    const [request, now, v2] = await rpc(ctx, () => Promise.all([
        readRequest(ctx.publicClient, ctx.contract, id),
        chainNow(ctx.publicClient),
        readRequestStateV2(ctx.publicClient, ctx.contract, id),
    ]));
    if (request.agent === zeroAddress) {
        throw toCliError({ name: "RequestNotFound", kind: "contract" }, { requestId: id });
    }
    const effective = effectiveRequestStatus(request, now, v2);
    const secondsLeft = effective.status === "pending" && request.expiresAt > now ? request.expiresAt - now : 0n;
    const note = noteFor(effective, request, id, now);
    const json = {
        status: effective.status,
        requestId: id.toString(),
        onchainStatus: effective.onchainStatus,
        expiredBecause: effective.expiredBecause,
        approvable: effective.approvable,
        amountReserved: effective.reserved,
        walletId: request.walletId.toString(),
        agent: request.agent,
        mine: request.agent.toLowerCase() === ctx.agentAddress.toLowerCase(),
        to: request.to,
        amount: formatUsdc(request.amount),
        memo: request.memo,
        expiresAt: iso(request.expiresAt),
        secondsLeft: Number(secondsLeft),
        note,
    };
    const human = `Request #${id} (${usd(request.amount)} to ${request.to}): ${effective.status}. ${note}`;
    return { json, effective, request, now, human };
}
//# sourceMappingURL=requests.js.map