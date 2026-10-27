/**
 * Live on-chain stats for Aider landing page.
 * Reads event logs from the Leash contract on Arc Testnet.
 * The contract has no aggregate counters — we derive them from logs.
 */
import { createPublicClient, http, parseAbiItem } from 'viem';
import { arcTestnet } from 'viem/chains';

// Deployed on Arc Testnet
export const LEASH_ADDRESS = '0xed32e15d81e7864bf19caea4333bd0781f328ba3' as const;
export const EXPLORER_URL = 'https://explorer.testnet.arc.io';

const client = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.io'),
});

export interface LiveStats {
  agentsConnected: number;   // unique agent addresses ever added
  agentPayments: number;     // total AgentPaid events
  usdcMovedCents: number;    // total USDC in cents (×100) — avoids float
  approvalsHandled: number;  // approved + rejected + expired requests
}

const AGENT_ADDED_ABI    = parseAbiItem('event AgentAdded(uint256 indexed walletId, address indexed agent, string label)');
const AGENT_PAID_ABI     = parseAbiItem('event AgentPaid(uint256 indexed walletId, address indexed agent, address indexed to, uint256 amount, string memo)');
const REQ_APPROVED_ABI   = parseAbiItem('event RequestApproved(uint256 indexed requestId, uint256 indexed walletId)');
const REQ_REJECTED_ABI   = parseAbiItem('event RequestRejected(uint256 indexed requestId, uint256 indexed walletId)');
const REQ_EXPIRED_ABI    = parseAbiItem('event RequestExpired(uint256 indexed requestId, uint256 indexed walletId)');

export async function fetchLiveStats(): Promise<LiveStats> {
  const blockNumber = await client.getBlockNumber();
  // Look back 100k blocks max (Arc Testnet is fast)
  const fromBlock = blockNumber > 100_000n ? blockNumber - 100_000n : 0n;

  const [addedLogs, paidLogs, approvedLogs, rejectedLogs, expiredLogs] =
    await Promise.all([
      client.getLogs({ address: LEASH_ADDRESS, event: AGENT_ADDED_ABI,  fromBlock }),
      client.getLogs({ address: LEASH_ADDRESS, event: AGENT_PAID_ABI,   fromBlock }),
      client.getLogs({ address: LEASH_ADDRESS, event: REQ_APPROVED_ABI, fromBlock }),
      client.getLogs({ address: LEASH_ADDRESS, event: REQ_REJECTED_ABI, fromBlock }),
      client.getLogs({ address: LEASH_ADDRESS, event: REQ_EXPIRED_ABI,  fromBlock }),
    ]);

  // Unique agent addresses
  const agentSet = new Set<string>();
  for (const log of addedLogs) {
    if (log.args.agent) agentSet.add(log.args.agent.toLowerCase());
  }

  // Total USDC moved (6 decimals → cents = amount * 100 / 1_000_000)
  let usdcRaw = 0n;
  for (const log of paidLogs) {
    if (log.args.amount) usdcRaw += log.args.amount;
  }
  // Convert to cents: usdcRaw is 6-decimal, cents = usdcRaw / 10_000
  const usdcMovedCents = Number(usdcRaw / 10_000n);

  return {
    agentsConnected:  agentSet.size,
    agentPayments:    paidLogs.length,
    usdcMovedCents,
    approvalsHandled: approvedLogs.length + rejectedLogs.length + expiredLogs.length,
  };
}

export function formatUsdcCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars.toFixed(2)}`;
}
