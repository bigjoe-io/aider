import { buildClients, readWallet, readAgent, formatUsdc } from "../chain.js";
export async function cmdBalance() {
    const clients = buildClients();
    const [wallet, agent] = await Promise.all([
        readWallet(clients),
        readAgent(clients),
    ]);
    const now = BigInt(Math.floor(Date.now() / 1000));
    const expiresAt = agent.expiresAt;
    const expiryDisplay = expiresAt === 0n
        ? "never"
        : expiresAt < now
            ? `EXPIRED (was ${new Date(Number(expiresAt) * 1000).toISOString()})`
            : new Date(Number(expiresAt) * 1000).toISOString();
    const remaining = agent.dailyLimit > agent.spentToday
        ? agent.dailyLimit - agent.spentToday
        : 0n;
    const result = {
        wallet: {
            id: clients.walletId.toString(),
            balance: formatUsdc(wallet.balance),
            reserved: formatUsdc(wallet.reserved),
            available: formatUsdc(wallet.available),
            paused: wallet.paused,
        },
        agent: {
            address: clients.agentAddress,
            label: agent.label,
            active: agent.active,
            perPaymentLimit: formatUsdc(agent.perPaymentLimit),
            dailyLimit: formatUsdc(agent.dailyLimit),
            spentToday: formatUsdc(agent.spentToday),
            remainingToday: formatUsdc(remaining),
            expiresAt: expiryDisplay,
        },
    };
    console.log(JSON.stringify(result, null, 2));
    if (wallet.paused) {
        console.log("\n⚠  Wallet is paused. All agent payments are blocked.");
    }
    if (!agent.active) {
        console.log("\n⚠  This agent has been revoked. Contact the wallet owner.");
    }
    if (expiresAt !== 0n && expiresAt < now) {
        console.log("\n⚠  This agent key has expired. Contact the wallet owner to extend it.");
    }
    const pct = agent.dailyLimit > 0n
        ? Math.round(Number((agent.spentToday * 100n) / agent.dailyLimit))
        : 0;
    console.log(`\nAvailable: ${formatUsdc(wallet.available)}  |  Daily: ${formatUsdc(agent.spentToday)} / ${formatUsdc(agent.dailyLimit)} (${pct}% used)`);
}
//# sourceMappingURL=balance.js.map