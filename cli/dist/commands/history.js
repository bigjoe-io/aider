import { buildClients, formatUsdc, txUrl, addrUrl } from "../chain.js";
import { parseAbiItem } from "viem";
const BLOCKS_BACK = 10000n;
export async function cmdHistory() {
    const clients = buildClients();
    const latestBlock = await clients.publicClient.getBlockNumber();
    const fromBlock = latestBlock > BLOCKS_BACK ? latestBlock - BLOCKS_BACK : 0n;
    // Fetch AgentPaid events for this agent on this wallet
    const logs = await clients.publicClient.getLogs({
        address: clients.contractAddress,
        event: parseAbiItem("event AgentPaid(uint256 indexed walletId, address indexed agent, address indexed to, uint256 amount, string memo)"),
        args: {
            walletId: clients.walletId,
            agent: clients.agentAddress,
        },
        fromBlock,
        toBlock: "latest",
    });
    if (logs.length === 0) {
        const result = { status: "ok", payments: [], count: 0 };
        console.log(JSON.stringify(result, null, 2));
        console.log("\nNo payments found in the last 10,000 blocks.");
        return;
    }
    const payments = logs.map((log) => {
        const { walletId, agent, to, amount, memo } = log.args;
        return {
            txHash: log.transactionHash ?? "",
            explorer: log.transactionHash ? txUrl(clients.explorerUrl, log.transactionHash) : "",
            blockNumber: log.blockNumber?.toString() ?? "",
            walletId: walletId.toString(),
            agent,
            to,
            toExplorer: addrUrl(clients.explorerUrl, to),
            amount: formatUsdc(amount),
            memo,
        };
    });
    const totalPaid = logs.reduce((acc, log) => acc + (log.args.amount ?? 0n), 0n);
    const result = {
        status: "ok",
        count: payments.length,
        total: formatUsdc(totalPaid),
        payments: payments.slice().reverse(), // newest first
    };
    console.log(JSON.stringify(result, null, 2));
    console.log(`\n${payments.length} payment(s) found, total ${formatUsdc(totalPaid)}.`);
}
//# sourceMappingURL=history.js.map