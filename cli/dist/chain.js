import { createPublicClient, createWalletClient, http, } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { AIDER_ABI } from "./abi.js";
import { loadConfig, loadKey } from "./config.js";
import { decodeError, isContractRejection, toCliError } from "./errors.js";
import { chainFor } from "./networks.js";
export function makePublicClient(chain, rpcUrl) {
    return createPublicClient({
        chain,
        transport: http(rpcUrl, { timeout: 20_000, retryCount: 2 }),
        pollingInterval: 1_000,
    });
}
/** Read-only context from ~/.aidr/config.json (no key needed). */
export function loadContext() {
    const cfg = loadConfig();
    const chain = chainFor(cfg.chainId, cfg.rpcUrl, cfg.explorerUrl);
    return {
        cfg,
        chain,
        publicClient: makePublicClient(chain, cfg.rpcUrl),
        contract: cfg.contract,
        walletId: BigInt(cfg.walletId),
        agentAddress: cfg.agentAddress,
    };
}
/** Context that can sign as the agent (loads ~/.aidr/key). */
export function loadSignerContext() {
    const ctx = loadContext();
    const account = privateKeyToAccount(loadKey(ctx.cfg));
    const walletClient = createWalletClient({
        account,
        chain: ctx.chain,
        transport: http(ctx.cfg.rpcUrl, { timeout: 20_000, retryCount: 2 }),
        pollingInterval: 1_000,
    });
    return { ...ctx, account, walletClient };
}
export function txUrl(cfg, hash) {
    return `${cfg.explorerUrl.replace(/\/+$/, "")}/tx/${hash}`;
}
export function addressUrl(cfg, address) {
    return `${cfg.explorerUrl.replace(/\/+$/, "")}/address/${address}`;
}
/** Wraps RPC/contract failures of read calls into friendly CliErrors. */
export async function rpc(ctx, fn) {
    try {
        return await fn();
    }
    catch (err) {
        throw toCliError(decodeError(err), { rpcUrl: ctx.cfg.rpcUrl });
    }
}
/** Latest block timestamp: the contract's notion of "now". */
export async function chainNow(publicClient) {
    const block = await publicClient.getBlock({ blockTag: "latest" });
    return block.timestamp;
}
export async function readWallet(publicClient, contract, walletId) {
    const [owner, balance, reserved, available, paused, mode] = await publicClient.readContract({
        address: contract,
        abi: AIDER_ABI,
        functionName: "getWallet",
        args: [walletId],
    });
    return { owner, balance, reserved, available, paused, mode };
}
export async function readAgent(publicClient, contract, walletId, agent) {
    const [label, perPaymentLimit, dailyLimit, expiresAt, active, spentToday, dayStart] = await publicClient.readContract({
        address: contract,
        abi: AIDER_ABI,
        functionName: "getAgent",
        args: [walletId, agent],
    });
    return { label, perPaymentLimit, dailyLimit, expiresAt, active, spentToday, dayStart };
}
export async function readRequest(publicClient, contract, requestId) {
    const r = await publicClient.readContract({
        address: contract,
        abi: AIDER_ABI,
        functionName: "getRequest",
        args: [requestId],
    });
    return {
        walletId: r.walletId,
        agent: r.agent,
        to: r.to,
        amount: r.amount,
        memo: r.memo,
        expiresAt: r.expiresAt,
        status: r.status,
    };
}
/**
 * v2's getRequestState(id). Returns null on a v1 contract (the function doesn't exist there and
 * the call reverts without data) or when the request doesn't exist. RPC failures are rethrown.
 */
export async function readRequestStateV2(publicClient, contract, requestId) {
    try {
        const [status, approvable, releasable] = await publicClient.readContract({
            address: contract,
            abi: AIDER_ABI,
            functionName: "getRequestState",
            args: [requestId],
        });
        return { status, approvable, releasable };
    }
    catch (err) {
        const d = decodeError(err);
        if (isContractRejection(d) || d.kind === "no_code")
            return null;
        throw err;
    }
}
/** Detects the v2 contract by calling MAX_REQUEST_TTL() (missing on v1). */
export async function detectVersion(publicClient, contract) {
    try {
        await publicClient.readContract({ address: contract, abi: AIDER_ABI, functionName: "MAX_REQUEST_TTL" });
        return "v2";
    }
    catch (err) {
        const d = decodeError(err);
        if (isContractRejection(d) || d.kind === "no_code")
            return "v1";
        throw err;
    }
}
//# sourceMappingURL=chain.js.map