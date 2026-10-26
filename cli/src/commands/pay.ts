import {
  getAddress,
  isAddress,
  isAddressEqual,
  parseEventLogs,
  zeroAddress,
  type Address,
  type Hash,
  type TransactionReceipt,
} from "viem";
import { AIDER_ABI } from "../abi.js";
import { AmountError, formatUsdc, parseUsdcAmount, usd } from "../amount.js";
import { chainNow, loadSignerContext, readAgent, readWallet, txUrl, type SignerCtx } from "../chain.js";
import {
  CliError,
  decodeError,
  explainError,
  isContractRejection,
  toCliError,
  type DecodedError,
  type ErrorContext,
} from "../errors.js";
import { USDC_ADDRESS } from "../networks.js";
import { emit, note } from "../output.js";
import { remainingToday } from "../state.js";

export interface PayOptions {
  /** false when --no-request is passed. */
  request: boolean;
  ttl?: string;
  sendAnyway?: boolean;
}

export const DEFAULT_TTL_MINUTES = 30;
export const MAX_TTL_MINUTES = 7 * 24 * 60; // the v2 contract's MAX_REQUEST_TTL
const MAX_MEMO_BYTES = 256;
const RECEIPT_TIMEOUT_MS = 90_000;
/** --send-anyway skips gas estimation (which refuses a reverting call), so it sends with a fixed limit. */
const SEND_ANYWAY_BASE_GAS = 250_000n;

type PayArgs = readonly [bigint, Address, bigint, string];
type RequestArgs = readonly [bigint, Address, bigint, string, bigint];
type Call = { fn: "agentPay"; args: PayArgs } | { fn: "requestPayment"; args: RequestArgs };
type Outcome<T> = { ok: true; value: T } | { ok: false; error: DecodedError };

async function attempt<T>(fn: () => Promise<T>): Promise<Outcome<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (err) {
    return { ok: false, error: decodeError(err) };
  }
}

function iso(ts: bigint): string {
  return new Date(Number(ts) * 1000).toISOString();
}

export function parseRecipient(raw: string): Address {
  const v = raw.trim();
  if (!isAddress(v)) {
    throw new CliError(
      "InvalidAddress",
      `"${raw}" is not a valid recipient address.`,
      "Pass the recipient's 0x address (42 characters). If it is mixed-case, the checksum must be right.",
    );
  }
  const to = getAddress(v);
  if (isAddressEqual(to, zeroAddress)) throw toCliError({ name: "ZeroAddress", kind: "contract" });
  return to;
}

export function parseAmountArg(raw: string): bigint {
  try {
    return parseUsdcAmount(raw);
  } catch (err) {
    if (err instanceof AmountError) {
      throw new CliError(
        "InvalidAmount",
        err.message,
        "Pass the amount in USDC, e.g. 0.05. If you add a $, quote it ('$0.05') so the shell doesn't expand it.",
      );
    }
    throw err;
  }
}

export function parseMemo(raw: string): string {
  const memo = raw.trim();
  if (memo === "") {
    throw new CliError(
      "MemoRequired",
      "A memo is required: say what the payment is for. The owner reads it.",
      'Example: aidr pay 0x… 0.05 "API credits for the weather lookup"',
    );
  }
  const bytes = new TextEncoder().encode(memo).length;
  if (bytes > MAX_MEMO_BYTES) {
    throw new CliError(
      "MemoTooLong",
      `The memo is ${bytes} bytes; the limit is ${MAX_MEMO_BYTES}.`,
      "Use one short sentence that says what the payment is for.",
    );
  }
  return memo;
}

export function parseTtl(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_TTL_MINUTES;
  const v = raw.trim();
  const n = /^\d+$/.test(v) ? Number(v) : NaN;
  if (!Number.isSafeInteger(n) || n < 1 || n > MAX_TTL_MINUTES) {
    const e = explainError({ name: "InvalidTTL", kind: "contract" });
    throw new CliError("InvalidTTL", `--ttl "${raw}" is not valid. ${e.message}`, e.hint);
  }
  return n;
}

/** Best-effort reads for friendlier messages; never fails the command. */
async function errorContext(ctx: SignerCtx, amount: bigint, to: Address): Promise<ErrorContext> {
  const base: ErrorContext = {
    amount,
    to,
    walletId: ctx.walletId,
    agentAddress: ctx.agentAddress,
    rpcUrl: ctx.cfg.rpcUrl,
  };
  try {
    const [agent, wallet, now] = await Promise.all([
      readAgent(ctx.publicClient, ctx.contract, ctx.walletId, ctx.agentAddress),
      readWallet(ctx.publicClient, ctx.contract, ctx.walletId),
      chainNow(ctx.publicClient),
    ]);
    return { ...base, agent, wallet, now };
  } catch {
    return base;
  }
}

function plainContext(ctx: SignerCtx): ErrorContext {
  return { rpcUrl: ctx.cfg.rpcUrl, agentAddress: ctx.agentAddress, walletId: ctx.walletId };
}

async function waitForReceipt(ctx: SignerCtx, hash: Hash): Promise<TransactionReceipt> {
  try {
    return await ctx.publicClient.waitForTransactionReceipt({ hash, timeout: RECEIPT_TIMEOUT_MS });
  } catch (err) {
    const d = decodeError(err);
    throw new CliError(
      d.kind === "rpc" ? "RpcError" : "ReceiptTimeout",
      `The transaction ${hash} was sent, but its confirmation couldn't be read (${d.kind === "rpc" ? "the RPC stopped answering" : "not confirmed in time"}).`,
      "Open the explorer link to see whether it went through before trying again, so nothing is paid twice.",
      { txHash: hash, explorer: txUrl(ctx.cfg, hash) },
    );
  }
}

/** Replays a reverted transaction's call at its block to recover the contract's error name. */
async function decodeRevertedTx(ctx: SignerCtx, call: Call, blockNumber: bigint): Promise<DecodedError> {
  const base = { account: ctx.account, address: ctx.contract, abi: AIDER_ABI, blockNumber } as const;
  const replay =
    call.fn === "agentPay"
      ? await attempt(() => ctx.publicClient.simulateContract({ ...base, functionName: "agentPay", args: call.args }))
      : await attempt(() => ctx.publicClient.simulateContract({ ...base, functionName: "requestPayment", args: call.args }));
  if (!replay.ok && isContractRejection(replay.error)) return replay.error;
  return { name: "TransactionReverted", kind: "reverted" };
}

async function emitRejectedOnchain(
  ctx: SignerCtx,
  receipt: TransactionReceipt,
  call: Call,
  amount: bigint,
  to: Address,
  memo: string,
): Promise<void> {
  const d = await decodeRevertedTx(ctx, call, receipt.blockNumber);
  const e = explainError(d, await errorContext(ctx, amount, to));
  const what = call.fn === "agentPay" ? "payment" : "approval request";
  emit(
    {
      status: "rejected_onchain",
      error: d.name,
      message: `The contract rejected the ${what} onchain. ${e.message} Nothing was paid; the transaction only cost gas.`,
      hint: e.hint,
      to,
      amount: formatUsdc(amount),
      memo,
      walletId: ctx.walletId.toString(),
      txHash: receipt.transactionHash,
      explorer: txUrl(ctx.cfg, receipt.transactionHash),
      blockNumber: receipt.blockNumber.toString(),
    },
    `Rejected onchain (${d.name}); nothing was paid. Proof: ${txUrl(ctx.cfg, receipt.transactionHash)}`,
  );
  process.exitCode = 1;
}

function emitPaid(
  ctx: SignerCtx,
  receipt: TransactionReceipt,
  to: Address,
  amount: bigint,
  memo: string,
  extra: Record<string, unknown> = {},
): void {
  emit(
    {
      status: "paid",
      to,
      amount: formatUsdc(amount),
      memo,
      walletId: ctx.walletId.toString(),
      txHash: receipt.transactionHash,
      explorer: txUrl(ctx.cfg, receipt.transactionHash),
      blockNumber: receipt.blockNumber.toString(),
      ...extra,
    },
    `Paid ${usd(amount)} to ${to}. ${txUrl(ctx.cfg, receipt.transactionHash)}`,
  );
}

export async function cmdPay(toRaw: string, amountRaw: string, memoRaw: string, opts: PayOptions): Promise<void> {
  const to = parseRecipient(toRaw);
  const amount = parseAmountArg(amountRaw);
  const memo = parseMemo(memoRaw);
  const ttlMinutes = parseTtl(opts.ttl);

  const ctx = loadSignerContext();

  // Paying the Aider contract or the USDC token debits the wallet and strands the USDC
  // (the v1 contract doesn't stop it), so refuse before anything is signed — even with --send-anyway.
  if (isAddressEqual(to, ctx.contract) || isAddressEqual(to, USDC_ADDRESS)) {
    throw toCliError({ name: "InvalidRecipient", kind: "contract" }, { to });
  }

  const payArgs: PayArgs = [ctx.walletId, to, amount, memo];
  if (opts.sendAnyway) {
    await sendAnyway(ctx, payArgs, to, amount, memo);
    return;
  }

  // 1. Simulate agentPay: a rejection comes back as the contract's error name before anything is sent.
  const sim = await attempt(() =>
    ctx.publicClient.simulateContract({
      account: ctx.account,
      address: ctx.contract,
      abi: AIDER_ABI,
      functionName: "agentPay",
      args: payArgs,
    }),
  );
  if (!sim.ok) {
    const d = sim.error;
    if (!isContractRejection(d)) throw toCliError(d, plainContext(ctx));
    if ((d.name === "OverPerPaymentLimit" || d.name === "OverDailyLimit") && opts.request) {
      await requestApproval(ctx, d.name, to, amount, memo, ttlMinutes);
      return;
    }
    throw toCliError(d, await errorContext(ctx, amount, to));
  }

  // 2. Send exactly the simulated call.
  const sent = await attempt(() => ctx.walletClient.writeContract(sim.value.request));
  if (!sent.ok) {
    const d = sent.error;
    throw toCliError(d, isContractRejection(d) ? await errorContext(ctx, amount, to) : plainContext(ctx));
  }

  // 3. Only a mined, successful receipt counts as paid.
  const receipt = await waitForReceipt(ctx, sent.value);
  if (receipt.status !== "success") {
    await emitRejectedOnchain(ctx, receipt, { fn: "agentPay", args: payArgs }, amount, to, memo);
    return;
  }
  emitPaid(ctx, receipt, to, amount, memo);
}

async function requestApproval(
  ctx: SignerCtx,
  reason: "OverPerPaymentLimit" | "OverDailyLimit",
  to: Address,
  amount: bigint,
  memo: string,
  ttlMinutes: number,
): Promise<void> {
  const errCtx = await errorContext(ctx, amount, to);
  const requestArgs: RequestArgs = [ctx.walletId, to, amount, memo, BigInt(ttlMinutes) * 60n];

  const sim = await attempt(() =>
    ctx.publicClient.simulateContract({
      account: ctx.account,
      address: ctx.contract,
      abi: AIDER_ABI,
      functionName: "requestPayment",
      args: requestArgs,
    }),
  );
  if (!sim.ok) {
    const d = sim.error;
    throw toCliError(d, isContractRejection(d) ? { ...errCtx, duringRequest: true } : errCtx);
  }

  const which = reason === "OverPerPaymentLimit" ? "per-payment" : "daily";
  note(`${usd(amount)} is over this agent's ${which} limit; asking the owner for approval…`);

  const sent = await attempt(() => ctx.walletClient.writeContract(sim.value.request));
  if (!sent.ok) {
    const d = sent.error;
    throw toCliError(d, isContractRejection(d) ? { ...errCtx, duringRequest: true } : errCtx);
  }
  const hash = sent.value;

  const receipt = await waitForReceipt(ctx, hash);
  if (receipt.status !== "success") {
    await emitRejectedOnchain(ctx, receipt, { fn: "requestPayment", args: requestArgs }, amount, to, memo);
    return;
  }

  // The request id and deadline come from the contract's own event, never from local guesses.
  const ev = parseEventLogs({
    abi: AIDER_ABI,
    eventName: "PaymentRequested",
    logs: receipt.logs.filter((l) => isAddressEqual(l.address, ctx.contract)),
  }).find((e) => isAddressEqual(e.args.agent, ctx.agentAddress) && e.args.walletId === ctx.walletId);
  if (!ev) {
    throw new CliError(
      "UnexpectedReceipt",
      "The approval request transaction succeeded, but its PaymentRequested event is missing.",
      "Open the explorer link and tell the user.",
      { txHash: hash, explorer: txUrl(ctx.cfg, hash) },
    );
  }

  const requestId = ev.args.requestId;
  const expiresAt = ev.args.expiresAt;
  const limitText =
    reason === "OverPerPaymentLimit"
      ? `over this agent's per-payment limit${errCtx.agent ? ` of ${usd(errCtx.agent.perPaymentLimit)}` : ""}`
      : `over what's left of this agent's daily limit${
          errCtx.agent && errCtx.now !== undefined
            ? ` (${usd(remainingToday(errCtx.agent, errCtx.now))} of ${usd(errCtx.agent.dailyLimit)} left today)`
            : ""
        }`;

  emit(
    {
      status: "pending_approval",
      requestId: requestId.toString(),
      reason,
      message: `${usd(amount)} is ${limitText}, so it needs the owner's approval. The amount is reserved until the owner approves or rejects it; if they don't decide by ${iso(expiresAt)}, the request expires and nothing is paid.`,
      hint: `Tell the user the payment is waiting for the owner's approval (request #${requestId}). Run \`aidr wait ${requestId}\` to wait for the decision, or \`aidr status ${requestId}\` to check.`,
      to,
      amount: formatUsdc(amount),
      memo,
      walletId: ctx.walletId.toString(),
      expiresAt: iso(expiresAt),
      ttlMinutes,
      txHash: hash,
      explorer: txUrl(ctx.cfg, hash),
      blockNumber: receipt.blockNumber.toString(),
    },
    `Waiting for the owner's approval: request #${requestId} for ${usd(amount)}, open until ${iso(expiresAt)}. Next: aidr wait ${requestId}`,
  );
}

async function sendAnyway(ctx: SignerCtx, payArgs: PayArgs, to: Address, amount: bigint, memo: string): Promise<void> {
  const gas = SEND_ANYWAY_BASE_GAS + 64n * BigInt(new TextEncoder().encode(memo).length);
  note("--send-anyway: sending without the pre-flight check. If the contract rejects the payment, the rejection is recorded onchain (costs gas).");
  const sent = await attempt(() =>
    ctx.walletClient.writeContract({
      address: ctx.contract,
      abi: AIDER_ABI,
      functionName: "agentPay",
      args: payArgs,
      gas,
    }),
  );
  if (!sent.ok) throw toCliError(sent.error, plainContext(ctx));

  const receipt = await waitForReceipt(ctx, sent.value);
  if (receipt.status !== "success") {
    await emitRejectedOnchain(ctx, receipt, { fn: "agentPay", args: payArgs }, amount, to, memo);
    return;
  }
  emitPaid(ctx, receipt, to, amount, memo, { sentAnyway: true });
}
