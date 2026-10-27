import { AIDER_ABI } from "../abi.js";
import { formatUsdc, usd } from "../amount.js";
import { loadContext, rpc, txUrl } from "../chain.js";
import { CliError, decodeError } from "../errors.js";
import { emit } from "../output.js";
/** Arc's eth_getLogs accepts at most 10,000 blocks (inclusive); stay safely under it. */
export const WINDOW_BLOCKS = 9500n;
const MIN_WINDOW_BLOCKS = 100n;
const PARALLEL_WINDOWS = 4;
const DEFAULT_LIMIT = 20;
const DEFAULT_BLOCKS = 500000n;
function parsePositiveInt(raw, flag, fallback, max) {
    if (raw === undefined)
        return fallback;
    const v = raw.trim();
    if (!/^\d+$/.test(v) || BigInt(v) < 1n || BigInt(v) > max) {
        throw new CliError("InvalidOption", `${flag} "${raw}" must be a whole number from 1 to ${max}.`, `Example: aidr history ${flag} ${fallback}`);
    }
    return BigInt(v);
}
/**
 * Block windows to scan, newest first: [from, to] inclusive, each at most `size` blocks,
 * covering exactly [floor, latest].
 */
export function scanWindows(latest, floor, size = WINDOW_BLOCKS) {
    const out = [];
    if (size < 1n)
        throw new Error("window size must be >= 1");
    let to = latest;
    while (to >= floor) {
        const from = to - size + 1n > floor ? to - size + 1n : floor;
        out.push([from, to]);
        if (from === 0n)
            break;
        to = from - 1n;
    }
    return out;
}
async function paymentsIn(ctx, from, to) {
    try {
        const logs = await ctx.publicClient.getContractEvents({
            address: ctx.contract,
            abi: AIDER_ABI,
            eventName: "AgentPaid",
            args: { walletId: ctx.walletId, agent: ctx.agentAddress },
            fromBlock: from,
            toBlock: to,
            strict: true,
        });
        return logs.map((l) => ({
            blockNumber: l.blockNumber,
            logIndex: l.logIndex,
            txHash: l.transactionHash,
            to: l.args.to,
            amount: l.args.amount,
            memo: l.args.memo,
        }));
    }
    catch (err) {
        // Some RPCs cap the range (or the result size) lower than Arc's 10,000 blocks: split the window and retry.
        const d = decodeError(err);
        const span = to - from + 1n;
        const text = err instanceof Error ? err.message : String(err);
        const tooBig = /range|limit|too (?:many|large|big)|exceed|max(?:imum)?|block/i.test(text);
        if (d.kind !== "rpc" && tooBig && span > MIN_WINDOW_BLOCKS) {
            const mid = from + span / 2n;
            const [newer, older] = await Promise.all([paymentsIn(ctx, mid, to), paymentsIn(ctx, from, mid - 1n)]);
            return [...newer, ...older];
        }
        throw err;
    }
}
async function blockTimes(publicClient, blocks) {
    const unique = [...new Set(blocks)];
    const times = new Map();
    await Promise.all(unique.map(async (n) => {
        try {
            const b = await publicClient.getBlock({ blockNumber: n });
            times.set(n, new Date(Number(b.timestamp) * 1000).toISOString());
        }
        catch {
            // Timestamps are a convenience; leave them out if the RPC can't serve the block.
        }
    }));
    return times;
}
export async function cmdHistory(opts) {
    const limit = Number(parsePositiveInt(opts.limit, "--limit", BigInt(DEFAULT_LIMIT), 1000n));
    const blocks = parsePositiveInt(opts.blocks, "--blocks", DEFAULT_BLOCKS, 10000000n);
    const ctx = await loadContext();
    const latest = await rpc(ctx, () => ctx.publicClient.getBlockNumber());
    const deployBlock = BigInt(ctx.cfg.deployBlock);
    const byBlocks = latest - blocks + 1n;
    const floor = byBlocks > deployBlock ? byBlocks : deployBlock;
    const windows = floor > latest ? [] : scanWindows(latest, floor);
    const found = [];
    let scannedFrom = latest + 1n;
    for (let i = 0; i < windows.length && found.length < limit; i += PARALLEL_WINDOWS) {
        const batch = windows.slice(i, i + PARALLEL_WINDOWS);
        const results = await rpc(ctx, () => Promise.all(batch.map(([from, to]) => paymentsIn(ctx, from, to))));
        for (const r of results)
            found.push(...r);
        scannedFrom = batch[batch.length - 1][0];
    }
    found.sort((a, b) => a.blockNumber === b.blockNumber ? b.logIndex - a.logIndex : a.blockNumber > b.blockNumber ? -1 : 1);
    const page = found.slice(0, limit);
    const times = await blockTimes(ctx.publicClient, page.map((p) => p.blockNumber));
    const reachedFloor = scannedFrom <= floor;
    const total = page.reduce((sum, p) => sum + p.amount, 0n);
    emit({
        status: "ok",
        walletId: ctx.walletId.toString(),
        agent: ctx.agentAddress,
        count: page.length,
        total: formatUsdc(total),
        payments: page.map((p) => ({
            time: times.get(p.blockNumber) ?? null,
            to: p.to,
            amount: formatUsdc(p.amount),
            memo: p.memo,
            txHash: p.txHash,
            explorer: txUrl(ctx.cfg, p.txHash),
            blockNumber: p.blockNumber.toString(),
        })),
        scanned: {
            fromBlock: (reachedFloor ? floor : scannedFrom).toString(),
            toBlock: latest.toString(),
        },
        olderMayExist: found.length > limit || !reachedFloor || floor > deployBlock,
    }, page.length === 0
        ? `No payments by this agent from wallet #${ctx.walletId} in blocks ${floor}–${latest}.`
        : `${page.length} payment(s), newest first, totalling ${usd(total)} (blocks ${reachedFloor ? floor : scannedFrom}–${latest}).`);
}
//# sourceMappingURL=history.js.map