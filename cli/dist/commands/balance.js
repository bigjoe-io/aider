import { zeroAddress } from "viem";
import { formatUsdc, usd } from "../amount.js";
import { chainNow, loadContext, readAgent, readWallet, rpc } from "../chain.js";
import { agentStatusNote, CliError } from "../errors.js";
import { emit } from "../output.js";
import { agentStatus, effectiveSpentToday, maxDirectPayment, nextUtcMidnight, remainingToday, } from "../state.js";
function iso(ts) {
    return new Date(Number(ts) * 1000).toISOString();
}
export async function cmdBalance() {
    const ctx = loadContext();
    const { publicClient, contract, walletId, agentAddress, cfg } = ctx;
    const [wallet, agent, now] = await rpc(ctx, () => Promise.all([
        readWallet(publicClient, contract, walletId),
        readAgent(publicClient, contract, walletId, agentAddress),
        chainNow(publicClient),
    ]));
    if (wallet.owner === zeroAddress) {
        throw new CliError("WALLET_NOT_FOUND", `Wallet #${walletId} doesn't exist on the Aider contract ${contract} (${cfg.networkName}).`, "Check the wallet id with the owner, then run `aidr init --wallet <id>` again.");
    }
    const status = agentStatus(agent, now);
    const spent = effectiveSpentToday(agent, now);
    const remaining = remainingToday(agent, now);
    const maxNow = maxDirectPayment(agent, wallet, now);
    const notes = [];
    if (wallet.paused)
        notes.push(`Wallet #${walletId} is paused: no agent can pay until the owner resumes it.`);
    const statusNote = agentStatusNote(agent, now, agentAddress, walletId);
    if (statusNote)
        notes.push(statusNote);
    emit({
        status: "ok",
        network: cfg.network,
        contract,
        wallet: {
            id: walletId.toString(),
            balance: formatUsdc(wallet.balance),
            reserved: formatUsdc(wallet.reserved),
            available: formatUsdc(wallet.available),
            paused: wallet.paused,
            recipientMode: wallet.mode === 1 ? "allowlist" : "any",
        },
        agent: {
            address: agentAddress,
            label: agent.label,
            status,
            perPaymentLimit: formatUsdc(agent.perPaymentLimit),
            dailyLimit: formatUsdc(agent.dailyLimit),
            spentToday: formatUsdc(spent),
            remainingToday: formatUsdc(remaining),
            dailyResetAt: iso(nextUtcMidnight(now)),
            expiresAt: agent.expiresAt === 0n ? null : iso(agent.expiresAt),
        },
        maxDirectPayment: formatUsdc(maxNow),
        notes,
    }, [
        `Wallet #${walletId}: ${usd(wallet.available)} available (${usd(wallet.reserved)} reserved)${wallet.paused ? ", PAUSED" : ""}. ` +
            `Agent ${status}: spent ${usd(spent)} of ${usd(agent.dailyLimit)} today, up to ${usd(agent.perPaymentLimit)} per payment.`,
        ...notes.map((n) => `Note: ${n}`),
    ].join("\n"));
}
//# sourceMappingURL=balance.js.map