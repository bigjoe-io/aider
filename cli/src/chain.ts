import {
  createPublicClient,
  createWalletClient,
  http,
  type Account,
  type Address,
  type Chain,
  type PublicClient,
  type Transport,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { AIDER_ABI } from "./abi.js";
import { loadConfig, loadKey, type AidrConfig } from "./config.js";
import { decodeError, isContractRejection, toCliError } from "./errors.js";
import { chainFor } from "./networks.js";
import type { AgentRecord, RequestRecord, RequestStateV2 } from "./state.js";

export interface Ctx {
  cfg: AidrConfig;
  chain: Chain;
  publicClient: PublicClient<Transport, Chain>;
  contract: Address;
  walletId: bigint;
  agentAddress: Address;
}

export interface SignerCtx extends Ctx {
  account: Account;
  walletClient: WalletClient<Transport, Chain, Account>;
}

export function makePublicClient(chain: Chain, rpcUrl: string): PublicClient<Transport, Chain> {
  return createPublicClient({
    chain,
    transport: http(rpcUrl, { timeout: 20_000, retryCount: 2 }),
    pollingInterval: 1_000,
  });
}

/** Read-only context from ~/.aidr/config.json (no key needed). */
export function loadContext(): Ctx {
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
export function loadSignerContext(): SignerCtx {
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

export function txUrl(cfg: Pick<AidrConfig, "explorerUrl">, hash: string): string {
  return `${cfg.explorerUrl.replace(/\/+$/, "")}/tx/${hash}`;
}

export function addressUrl(cfg: Pick<AidrConfig, "explorerUrl">, address: string): string {
  return `${cfg.explorerUrl.replace(/\/+$/, "")}/address/${address}`;
}

/** Wraps RPC/contract failures of read calls into friendly CliErrors. */
export async function rpc<T>(ctx: Pick<Ctx, "cfg">, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw toCliError(decodeError(err), { rpcUrl: ctx.cfg.rpcUrl });
  }
}

/** Latest block timestamp: the contract's notion of "now". */
export async function chainNow(publicClient: PublicClient<Transport, Chain>): Promise<bigint> {
  const block = await publicClient.getBlock({ blockTag: "latest" });
  return block.timestamp;
}

export interface WalletRecord {
  owner: Address;
  balance: bigint;
  reserved: bigint;
  available: bigint;
  paused: boolean;
  mode: number;
}

export async function readWallet(
  publicClient: PublicClient<Transport, Chain>,
  contract: Address,
  walletId: bigint,
): Promise<WalletRecord> {
  const [owner, balance, reserved, available, paused, mode] = await publicClient.readContract({
    address: contract,
    abi: AIDER_ABI,
    functionName: "getWallet",
    args: [walletId],
  });
  return { owner, balance, reserved, available, paused, mode };
}

export async function readAgent(
  publicClient: PublicClient<Transport, Chain>,
  contract: Address,
  walletId: bigint,
  agent: Address,
): Promise<AgentRecord> {
  const [label, perPaymentLimit, dailyLimit, expiresAt, active, spentToday, dayStart] =
    await publicClient.readContract({
      address: contract,
      abi: AIDER_ABI,
      functionName: "getAgent",
      args: [walletId, agent],
    });
  return { label, perPaymentLimit, dailyLimit, expiresAt, active, spentToday, dayStart };
}

export async function readRequest(
  publicClient: PublicClient<Transport, Chain>,
  contract: Address,
  requestId: bigint,
): Promise<RequestRecord> {
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
export async function readRequestStateV2(
  publicClient: PublicClient<Transport, Chain>,
  contract: Address,
  requestId: bigint,
): Promise<RequestStateV2 | null> {
  try {
    const [status, approvable, releasable] = await publicClient.readContract({
      address: contract,
      abi: AIDER_ABI,
      functionName: "getRequestState",
      args: [requestId],
    });
    return { status, approvable, releasable };
  } catch (err) {
    const d = decodeError(err);
    if (isContractRejection(d) || d.kind === "no_code") return null;
    throw err;
  }
}

/** Detects the v2 contract by calling MAX_REQUEST_TTL() (missing on v1). */
export async function detectVersion(
  publicClient: PublicClient<Transport, Chain>,
  contract: Address,
): Promise<"v1" | "v2"> {
  try {
    await publicClient.readContract({ address: contract, abi: AIDER_ABI, functionName: "MAX_REQUEST_TTL" });
    return "v2";
  } catch (err) {
    const d = decodeError(err);
    if (isContractRejection(d) || d.kind === "no_code") return "v1";
    throw err;
  }
}
