import {
  BaseError,
  ChainMismatchError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  HttpRequestError,
  InsufficientFundsError,
  NonceTooHighError,
  NonceTooLowError,
  SocketClosedError,
  TimeoutError,
  WaitForTransactionReceiptTimeoutError,
} from "viem";
import { usd } from "./amount.js";
import {
  agentStatus,
  effectiveSpentToday,
  nextUtcMidnight,
  remainingToday,
  type AgentRecord,
} from "./state.js";

/**
 * A failure the CLI reports as {"status":"error","error":code,"message","hint", ...extra} with
 * exit code 1. `code` is the contract's error name when the contract rejected something.
 */
export class CliError extends Error {
  readonly code: string;
  readonly hint: string;
  readonly extra: Record<string, unknown>;

  constructor(code: string, message: string, hint: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.name = "CliError";
    this.code = code;
    this.hint = hint;
    this.extra = extra;
  }
}

export type DecodedKind =
  | "contract" // custom error from the ABI, e.g. OverDailyLimit
  | "require" // require(..., "WALLET_NOT_FOUND") string
  | "panic" // Solidity panic (assert, overflow, ...)
  | "unknown_contract_error" // custom error selector that isn't in the ABI
  | "reverted" // reverted without any data
  | "no_code" // the call returned no data: no contract at the address
  | "rpc" // couldn't reach the RPC
  | "gas_funds" // the agent can't pay for gas
  | "nonce" // another transaction from this key got in the way
  | "chain" // RPC is on a different chain than the config
  | "receipt_timeout" // sent, but not confirmed in time
  | "other";

export interface DecodedError {
  /** Contract error name, require string, or a CLI code such as RpcError. */
  name: string;
  kind: DecodedKind;
  /** Short technical detail (panic reason, selector, RPC message). */
  detail?: string;
}

/** True when the contract (not the RPC or the client) rejected the call. */
export function isContractRejection(d: DecodedError): boolean {
  return (
    d.kind === "contract" ||
    d.kind === "require" ||
    d.kind === "panic" ||
    d.kind === "unknown_contract_error" ||
    d.kind === "reverted"
  );
}

/** Decodes any error thrown by viem (simulate/read/write/wait) using the full Aider ABI. */
export function decodeError(err: unknown): DecodedError {
  if (err instanceof CliError) return { name: err.code, kind: "other", detail: err.message };
  if (!(err instanceof BaseError)) {
    const msg = err instanceof Error ? err.message : String(err);
    return classifyByMessage(msg) ?? { name: "UnexpectedError", kind: "other", detail: msg };
  }

  const reverted = err.walk((e) => e instanceof ContractFunctionRevertedError);
  if (reverted instanceof ContractFunctionRevertedError) {
    const errorName = reverted.data?.errorName;
    if (errorName === "Error") {
      return { name: reverted.reason ?? "ExecutionReverted", kind: "require" };
    }
    if (errorName === "Panic") {
      return { name: "Panic", kind: "panic", detail: reverted.reason };
    }
    if (errorName) return { name: errorName, kind: "contract" };
    if (reverted.signature) {
      return { name: "UnknownContractError", kind: "unknown_contract_error", detail: reverted.signature };
    }
    return { name: "ExecutionReverted", kind: "reverted", detail: reverted.reason };
  }

  if (err.walk((e) => e instanceof ContractFunctionZeroDataError)) {
    return { name: "NoContractCode", kind: "no_code" };
  }
  if (err.walk((e) => e instanceof InsufficientFundsError)) {
    return { name: "InsufficientGasFunds", kind: "gas_funds" };
  }
  if (err.walk((e) => e instanceof NonceTooLowError || e instanceof NonceTooHighError)) {
    return { name: "NonceConflict", kind: "nonce" };
  }
  if (err.walk((e) => e instanceof ChainMismatchError)) {
    return { name: "ChainMismatch", kind: "chain", detail: err.shortMessage };
  }
  if (err.walk((e) => e instanceof WaitForTransactionReceiptTimeoutError)) {
    return { name: "ReceiptTimeout", kind: "receipt_timeout" };
  }
  const transport = err.walk(
    (e) => e instanceof HttpRequestError || e instanceof TimeoutError || e instanceof SocketClosedError,
  );
  if (transport) {
    const detail = transport instanceof BaseError ? transport.details || transport.shortMessage : undefined;
    return { name: "RpcError", kind: "rpc", detail };
  }
  return (
    classifyByMessage(`${err.shortMessage} ${err.details ?? ""}`) ?? {
      name: "UnexpectedError",
      kind: "other",
      detail: err.shortMessage,
    }
  );
}

function classifyByMessage(msg: string): DecodedError | undefined {
  if (/insufficient funds/i.test(msg)) return { name: "InsufficientGasFunds", kind: "gas_funds" };
  if (/nonce too (low|high)|replacement transaction underpriced|already known/i.test(msg)) {
    return { name: "NonceConflict", kind: "nonce" };
  }
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET|socket hang up|network/i.test(msg)) {
    return { name: "RpcError", kind: "rpc", detail: msg.slice(0, 200) };
  }
  return undefined;
}

// ── friendly messages ────────────────────────────────────────────────────────

export interface ErrorContext {
  amount?: bigint;
  to?: string;
  walletId?: bigint;
  agentAddress?: string;
  agent?: AgentRecord;
  wallet?: { available: bigint; paused: boolean };
  /** Chain time (seconds). */
  now?: bigint;
  ttlMinutes?: number;
  rpcUrl?: string;
  requestId?: bigint;
  /** Set when the payment went over a limit and the fallback approval request failed. */
  duringRequest?: boolean;
}

export interface Explanation {
  message: string;
  hint: string;
}

const STOP = "Stop and tell the user. Don't retry";

function iso(ts: bigint): string {
  return new Date(Number(ts) * 1000).toISOString();
}

/** Every error name the CLI explains specifically (all contract errors and require strings). */
export const EXPLAINED_ERRORS = [
  "NotWalletOwner",
  "WalletPaused",
  "AgentNotActive",
  "AgentRevokedError",
  "AgentExpired",
  "RecipientNotAllowed",
  "RecipientBlocked",
  "OverPerPaymentLimit",
  "OverDailyLimit",
  "InsufficientBalance",
  "RequestNotPending",
  "RequestExpiredError",
  "ZeroAmount",
  "ZeroAddress",
  "InvalidTTL",
  "RequestNotExpiredYet",
  "RequestNotFound",
  "InvalidRecipient",
  "OwnerCannotBeAgent",
  "InvalidExpiry",
  "TooManyOpenRequests",
  "ReentrancyGuardReentrantCall",
  "WALLET_NOT_FOUND",
  "USDC_TRANSFER_FROM_FAILED",
  "USDC_TRANSFER_FAILED",
  "Panic",
  "UnknownContractError",
  "ExecutionReverted",
  "TransactionReverted",
  "NoContractCode",
  "InsufficientGasFunds",
  "NonceConflict",
  "ChainMismatch",
  "ReceiptTimeout",
  "RpcError",
] as const;

/** Turns an error name into a plain-language message and what to do next. */
export function explainError(d: DecodedError, ctx: ErrorContext = {}): Explanation {
  const amt = ctx.amount !== undefined ? usd(ctx.amount) : "this amount";
  const wallet = ctx.walletId !== undefined ? `wallet #${ctx.walletId}` : "the wallet";
  const me = ctx.agentAddress ?? "this agent";
  const noRequest = ctx.duringRequest ? " No approval request was created." : "";

  switch (d.name) {
    case "WalletPaused":
      return {
        message: `The owner has paused ${wallet}. No agent can pay or request payments until they resume it.${noRequest}`,
        hint: `${STOP} until the owner resumes the wallet.`,
      };
    case "AgentNotActive":
      return {
        message: `${me} is not an agent on ${wallet}: the owner never added it.`,
        hint: `Ask the wallet owner to add ${me} as an agent (Aider app → Agents → Add agent), then try again.`,
      };
    case "AgentRevokedError":
      return {
        message: `The wallet owner revoked this agent (${me}). It can no longer pay or request payments.${noRequest}`,
        hint: `${STOP}. Only the owner can re-enable this agent.`,
      };
    case "AgentExpired": {
      const when = ctx.agent && ctx.agent.expiresAt !== 0n ? ` at ${iso(ctx.agent.expiresAt)}` : "";
      return {
        message: `This agent's key expired${when}. It can no longer pay or request payments.${noRequest}`,
        hint: `${STOP}. Ask the owner to extend the agent's expiry.`,
      };
    }
    case "RecipientBlocked":
      return {
        message: `${ctx.to ?? "The recipient"} is on ${wallet}'s blocklist.${noRequest}`,
        hint: "Don't pay this address. Tell the user; only the owner can unblock it.",
      };
    case "RecipientNotAllowed":
      return {
        message: `${wallet} only pays allowlisted recipients, and ${ctx.to ?? "this recipient"} is not on the allowlist.${noRequest}`,
        hint: "Ask the owner to allowlist the address (Aider app → Rules). Don't switch to another address to get around the rule.",
      };
    case "OverPerPaymentLimit": {
      const limit = ctx.agent ? ` of ${usd(ctx.agent.perPaymentLimit)}` : "";
      return {
        message: `${amt} is over this agent's per-payment limit${limit}.`,
        hint: "Run `aidr pay` without --no-request (and without --send-anyway) to ask the owner to approve it. Never split a payment into smaller ones to fit under the limit.",
      };
    }
    case "OverDailyLimit": {
      let detail = "";
      if (ctx.agent && ctx.now !== undefined) {
        const spent = effectiveSpentToday(ctx.agent, ctx.now);
        detail = ` (spent ${usd(spent)} of ${usd(ctx.agent.dailyLimit)} today, ${usd(remainingToday(ctx.agent, ctx.now))} left; resets at ${iso(nextUtcMidnight(ctx.now))})`;
      }
      return {
        message: `${amt} is over what's left of this agent's daily limit${detail}.`,
        hint: "Run `aidr pay` without --no-request (and without --send-anyway) to ask the owner to approve it, or wait for the daily limit to reset at 00:00 UTC. Never split a payment to fit.",
      };
    }
    case "InsufficientBalance": {
      const avail = ctx.wallet ? `only ${usd(ctx.wallet.available)} available` : "not enough available";
      return {
        message: `${wallet} has ${avail}, less than ${amt}. No approval request was created.`,
        hint: "Tell the user the owner needs to deposit more USDC (reserved funds of open requests don't count as available).",
      };
    }
    case "ZeroAmount":
      return { message: "The amount must be greater than 0.", hint: "Pass an amount like 0.05." };
    case "ZeroAddress":
      return { message: "The recipient can't be the zero address.", hint: "Pass the recipient's real address." };
    case "InvalidRecipient":
      return {
        message: `${ctx.to ?? "That address"} is the Aider contract or the USDC token. A payment to it would leave the funds stuck, so it's refused.`,
        hint: "Pay the recipient's own wallet address. Aider wallets can't receive payments; their owner funds them with a deposit.",
      };
    case "InvalidTTL":
      return {
        message: "The approval window (--ttl) must be between 1 minute and 7 days (10080 minutes).",
        hint: "Use --ttl <minutes> with a value from 1 to 10080, or leave it out for 30 minutes.",
      };
    case "TooManyOpenRequests":
      return {
        message: `This agent already has the maximum number of open approval requests on ${wallet} (10).${noRequest}`,
        hint: "Wait for the owner to approve or reject the open ones (check them with `aidr status <id>`), or for them to expire.",
      };
    case "RequestNotFound":
      return {
        message: `There is no request #${ctx.requestId ?? "?"} on this contract.`,
        hint: "Use the requestId printed by `aidr pay` (\"pending_approval\").",
      };
    case "RequestNotPending":
      return { message: "That request is no longer pending.", hint: "Check it with `aidr status <id>`." };
    case "RequestExpiredError":
      return {
        message: "That request's approval window has passed, so it can no longer be approved.",
        hint: "If the payment is still needed, run `aidr pay` again to create a new request.",
      };
    case "RequestNotExpiredYet":
      return {
        message: "That request's approval window hasn't passed yet, so its funds can't be released.",
        hint: "Wait until it expires, or ask the owner to reject it.",
      };
    case "NotWalletOwner":
      return {
        message: "Only the wallet owner can do that.",
        hint: "Agents can't change settings, approve requests or move the wallet's funds. Ask the owner.",
      };
    case "OwnerCannotBeAgent":
      return {
        message: "The wallet owner's address can't be an agent of its own wallet.",
        hint: "Give the agent its own key, separate from the owner's.",
      };
    case "InvalidExpiry":
      return {
        message: "The agent expiry must be in the future (or 0 for no expiry).",
        hint: "Pick a later expiry date.",
      };
    case "ReentrancyGuardReentrantCall":
      return { message: "The contract refused a re-entrant call.", hint: "Try again; tell the user if it repeats." };
    case "WALLET_NOT_FOUND":
      return {
        message: `${wallet} doesn't exist on this contract.`,
        hint: "Check the wallet id with the owner, then run `aidr init --wallet <id>` again.",
      };
    case "USDC_TRANSFER_FAILED":
    case "USDC_TRANSFER_FROM_FAILED":
      return {
        message: "The USDC transfer inside the contract failed.",
        hint: "Try again later and tell the user if it keeps failing.",
      };
    case "Panic":
      return {
        message: `The contract stopped with an internal error${d.detail ? ` (${d.detail})` : ""}.`,
        hint: "Tell the user; this shouldn't happen.",
      };
    case "UnknownContractError":
      return {
        message: `The contract rejected the call with an error this CLI doesn't know (${d.detail ?? "unknown selector"}).`,
        hint: "Check that the configured contract is an Aider contract (`aidr init --contract <address>`).",
      };
    case "ExecutionReverted":
      return {
        message: "The contract rejected the call without giving a reason.",
        hint: "Check that the configured contract is an Aider contract and the wallet id is right.",
      };
    case "TransactionReverted":
      return {
        message: "The transaction was mined but reverted without a reason the CLI could recover.",
        hint: "Run `aidr balance` to check the wallet and this agent, and tell the user.",
      };
    case "NoContractCode":
      return {
        message: "There is no contract at the configured address on this network.",
        hint: "Check --contract and --network, then run `aidr init` again.",
      };
    case "InsufficientGasFunds":
      return {
        message: `${me} doesn't have enough USDC to pay the network fee (gas). Gas on Arc is paid in USDC from the agent's own address, not from the Aider wallet.`,
        hint: `Ask the user to send a little USDC (e.g. 0.50) to ${me} for gas.`,
      };
    case "NonceConflict":
      return {
        message: "Another transaction from this agent's key was sent at the same time.",
        hint: "Run one payment at a time. Check `aidr history` before retrying so nothing is paid twice.",
      };
    case "ChainMismatch":
      return {
        message: `The RPC is on a different chain than the one aidr was set up for${d.detail ? ` (${d.detail})` : ""}.`,
        hint: "Run `aidr init` again with the right --network and --rpc.",
      };
    case "ReceiptTimeout":
      return {
        message: "The transaction was sent but not confirmed in time.",
        hint: "Check the explorer link before retrying so nothing is paid twice.",
      };
    case "RpcError":
      return {
        message: `Couldn't reach the network RPC${ctx.rpcUrl ? ` at ${ctx.rpcUrl}` : ""}${d.detail ? ` (${d.detail})` : ""}.`,
        hint: "Check the internet connection and try again, or run `aidr init` again with --rpc <url>.",
      };
    default:
      return {
        message: d.detail ? `${d.name}: ${d.detail}` : d.name,
        hint: "Tell the user what happened. Run `aidr balance` to check the wallet and agent.",
      };
  }
}

/** The CliError for a decoded failure, with a friendly message and hint. */
export function toCliError(d: DecodedError, ctx: ErrorContext = {}, extra: Record<string, unknown> = {}): CliError {
  const { message, hint } = explainError(d, ctx);
  return new CliError(d.name, message, hint, extra);
}

/** Agent status wording shared by balance and init. */
export function agentStatusNote(a: AgentRecord, now: bigint, agentAddress: string, walletId: bigint): string | null {
  switch (agentStatus(a, now)) {
    case "not_added":
      return `${agentAddress} is not an agent on wallet #${walletId} yet. The owner must add it before it can pay.`;
    case "revoked":
      return `The owner revoked this agent on wallet #${walletId}. It can't pay until the owner re-enables it.`;
    case "expired":
      return `This agent's key expired at ${iso(a.expiresAt)}. The owner must extend it before it can pay.`;
    default:
      return null;
  }
}
