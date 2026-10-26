import { isAddress } from "viem";
import {
  buildClients,
  readAgent,
  readWallet,
  parseUsdc,
  formatUsdc,
  decodeRevertError,
  LIMIT_ERRORS,
  txUrl,
} from "../chain.js";
import { LEASH_ABI as ABI } from "../abi.js";
import { die } from "../config.js";

const REQUEST_TTL_SECONDS = 30n * 60n; // 30 minutes

export async function cmdPay(
  to: string,
  amountStr: string,
  memo: string,
  opts: { noRequest?: boolean },
): Promise<void> {
  if (!isAddress(to)) die(`Invalid recipient address: "${to}"`);
  if (!memo || memo.trim().length === 0) die('Memo is required. Example: leash pay 0x... 1.00 "API credits"');

  let amount: bigint;
  try {
    amount = parseUsdc(amountStr);
  } catch {
    die(`Invalid amount "${amountStr}". Use decimal USDC, e.g. "1.50"`);
  }
  if (amount === 0n) die("Amount must be greater than zero.");

  const clients = buildClients();

  // ── pre-flight checks (friendly errors before hitting the chain) ─────────
  const [wallet, agent] = await Promise.all([readWallet(clients), readAgent(clients)]);
  const now = BigInt(Math.floor(Date.now() / 1000));

  if (wallet.paused) {
    outputAndExit({
      status: "error",
      error:  "WalletPaused",
      message:
        "The wallet is paused. No agent payments are possible right now. " +
        "Contact the wallet owner to resume.",
    });
  }
  if (!agent.active) {
    outputAndExit({
      status: "error",
      error:  "AgentRevoked",
      message:
        "This agent has been revoked. Contact the wallet owner to re-add the agent.",
    });
  }
  if (agent.expiresAt !== 0n && agent.expiresAt < now) {
    outputAndExit({
      status: "error",
      error:  "AgentExpired",
      message: `This agent key expired at ${new Date(Number(agent.expiresAt) * 1000).toISOString()}. Contact the wallet owner to extend it.`,
    });
  }

  // ── attempt agentPay ──────────────────────────────────────────────────────
  try {
    const hash = await clients.walletClient.writeContract({
      account: clients.account,
      address: clients.contractAddress,
      abi:     ABI,
      functionName: "agentPay",
      args: [clients.walletId, to as `0x${string}`, amount, memo],
      chain: undefined,
    });

    const receipt = await clients.walletClient.waitForTransactionReceipt({ hash });

    const result = {
      status:   "paid",
      txHash:   hash,
      explorer: txUrl(clients.explorerUrl, hash),
      to,
      amount:   formatUsdc(amount),
      memo,
      gasUsed:  receipt.gasUsed.toString(),
    };
    console.log(JSON.stringify(result, null, 2));
    console.log(`\nPaid ${formatUsdc(amount)} to ${to}. Tx: ${txUrl(clients.explorerUrl, hash)}`);
    return;
  } catch (err) {
    const errorName = decodeRevertError(err);

    // ── non-limit errors: just fail with a clear message ─────────────────
    if (!LIMIT_ERRORS.has(errorName) || opts.noRequest) {
      outputAndExit(buildPayError(errorName, amount, agent, wallet, opts.noRequest ?? false));
    }

    // ── limit hit: fall back to requestPayment ────────────────────────────
    console.error(
      `\nDirect payment blocked (${humanError(errorName, amount, agent, wallet)}). ` +
        `Creating approval request (30 min TTL)...`,
    );
  }

  // ── requestPayment fallback ───────────────────────────────────────────────
  try {
    const hash = await clients.walletClient.writeContract({
      account: clients.account,
      address: clients.contractAddress,
      abi:     ABI,
      functionName: "requestPayment",
      args: [clients.walletId, to as `0x${string}`, amount, memo, REQUEST_TTL_SECONDS],
      chain: undefined,
    });

    const receipt = await clients.walletClient.waitForTransactionReceipt({ hash });

    // Extract requestId from logs
    let requestId: string | null = null;
    for (const log of receipt.logs) {
      // PaymentRequested topic0 — use topic1 (requestId, indexed)
      if (log.topics.length >= 2) {
        try {
          requestId = BigInt(log.topics[1] as string).toString();
          break;
        } catch { /* skip */ }
      }
    }

    const result = {
      status:    "pending_approval",
      requestId,
      txHash:    hash,
      explorer:  txUrl(clients.explorerUrl, hash),
      to,
      amount:    formatUsdc(amount),
      memo,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
    console.log(JSON.stringify(result, null, 2));
    console.log(
      `\nApproval request created (ID: ${requestId ?? "unknown"}). The wallet owner must approve it. ` +
        `Run \`leash wait ${requestId ?? "<requestId>"}\` to track it.`,
    );
  } catch (err) {
    const errorName = decodeRevertError(err);
    outputAndExit(buildPayError(errorName, amount, agent, wallet, false));
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function humanError(
  errorName: string,
  amount: bigint,
  agent: { perPaymentLimit: bigint; dailyLimit: bigint; spentToday: bigint },
  wallet: { available: bigint },
): string {
  switch (errorName) {
    case "OverPerPaymentLimit":
      return (
        `Over per-payment limit (${formatUsdc(agent.perPaymentLimit)}). ` +
        `This payment: ${formatUsdc(amount)}.`
      );
    case "OverDailyLimit": {
      const remaining =
        agent.dailyLimit > agent.spentToday ? agent.dailyLimit - agent.spentToday : 0n;
      return (
        `Over daily limit (${formatUsdc(agent.dailyLimit)}). ` +
        `Spent today: ${formatUsdc(agent.spentToday)}. ` +
        `Remaining: ${formatUsdc(remaining)}.`
      );
    }
    case "InsufficientBalance":
      return `Insufficient wallet balance. Available: ${formatUsdc(wallet.available)}, requested: ${formatUsdc(amount)}.`;
    case "RecipientBlocked":
      return "Recipient is on the wallet's blocklist.";
    case "RecipientNotAllowed":
      return "Recipient is not on the wallet's allowlist (wallet is in allowlist-only mode).";
    default:
      return errorName;
  }
}

function buildPayError(
  errorName: string,
  amount: bigint,
  agent: { perPaymentLimit: bigint; dailyLimit: bigint; spentToday: bigint },
  wallet: { available: bigint },
  noRequestFlag: boolean,
): object {
  const base = {
    status:  "error",
    error:   errorName,
    message: "",
    hint:    "",
  };

  switch (errorName) {
    case "OverPerPaymentLimit":
      return {
        ...base,
        message: `Over your per-payment limit (${formatUsdc(agent.perPaymentLimit)}). This payment: ${formatUsdc(amount)}.`,
        hint: noRequestFlag
          ? "Remove --no-request to create an approval request instead."
          : "Ask the wallet owner to raise your per-payment limit, or run without --no-request.",
      };
    case "OverDailyLimit": {
      const remaining =
        agent.dailyLimit > agent.spentToday ? agent.dailyLimit - agent.spentToday : 0n;
      return {
        ...base,
        message: `Over your daily limit (${formatUsdc(agent.dailyLimit)}). Spent today: ${formatUsdc(agent.spentToday)}. Remaining: ${formatUsdc(remaining)}.`,
        hint: noRequestFlag
          ? "Remove --no-request to create an approval request instead."
          : "Ask the owner to raise your daily limit.",
      };
    }
    case "InsufficientBalance":
      return {
        ...base,
        message: `Insufficient wallet balance. Available: ${formatUsdc(wallet.available)}, requested: ${formatUsdc(amount)}.`,
        hint: "Ask the wallet owner to deposit more USDC.",
      };
    case "RecipientBlocked":
      return {
        ...base,
        message: "Recipient is on the wallet's blocklist.",
        hint: "Ask the wallet owner to remove the recipient from the blocklist.",
      };
    case "RecipientNotAllowed":
      return {
        ...base,
        message: "Recipient is not on the wallet's allowlist (wallet is in allowlist-only mode).",
        hint: "Ask the wallet owner to add this recipient to the allowlist.",
      };
    default:
      return { ...base, message: `Transaction reverted: ${errorName}.` };
  }
}

function outputAndExit(result: object): never {
  console.log(JSON.stringify(result, null, 2));
  const r = result as { message?: string };
  const hint = (result as { hint?: string }).hint;
  console.error(`\nError: ${r.message ?? "Unknown error"}`);
  if (hint) console.error(`Hint:  ${hint}`);
  process.exit(1);
}
