import { getAddress, isAddress, isAddressEqual, zeroAddress, type Address, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { existsSync, rmSync } from "node:fs";
import { chainNow, detectVersion, makePublicClient, readAgent, readWallet } from "../chain.js";
import { configDir, configPath, keyPath, normalizeKey, readSavedKey, saveConfig, tryLoadConfig, type AidrConfig } from "../config.js";
import { agentStatusNote, CliError, decodeError, explainError } from "../errors.js";
import { NETWORKS, USDC_ADDRESS, chainFor, type NetworkName, type NetworkPreset } from "../networks.js";
import { connectLink, resolveAppUrl } from "../link.js";
import { emit, note, registerSecret } from "../output.js";
import { agentStatus } from "../state.js";

export interface InitOptions {
  wallet: string;
  key?: string;
  network?: string;
  mainnet?: boolean;
  contract?: string;
  rpc?: string;
  deployBlock?: string;
}

const KEY_ENV = "AIDR_AGENT_KEY";

function resolveNetwork(opts: Pick<InitOptions, "network" | "mainnet">): NetworkPreset {
  const requested = opts.network?.trim().toLowerCase();
  if (requested !== undefined && requested !== "testnet" && requested !== "mainnet") {
    throw new CliError("InvalidNetwork", `Unknown network "${opts.network}".`, "Use --network testnet or --network mainnet.");
  }
  if (opts.mainnet && requested === "testnet") {
    throw new CliError("InvalidNetwork", "--mainnet and --network testnet contradict each other.", "Pass only one of them.");
  }
  const name: NetworkName = opts.mainnet ? "mainnet" : (requested ?? "testnet");
  return NETWORKS[name];
}

function resolveKey(opts: InitOptions): Hex {
  const fromFlag = opts.key;
  const fromEnv = process.env[KEY_ENV];
  registerSecret(fromFlag);
  registerSecret(fromEnv);

  const flagKey = fromFlag !== undefined ? normalizeKey(fromFlag) : undefined;
  const envKey = fromEnv !== undefined && fromEnv.trim() !== "" ? normalizeKey(fromEnv) : undefined;

  if (fromFlag !== undefined && !flagKey) {
    throw new CliError("KeyInvalid", "--key is not a valid private key (expected 64 hex characters, 0x optional).", `Prefer: export ${KEY_ENV}=0x<the agent's private key>`);
  }
  if (envKey === null) {
    throw new CliError("KeyInvalid", `${KEY_ENV} is not a valid private key (expected 64 hex characters, 0x optional).`, `Set it again: export ${KEY_ENV}=0x<the agent's private key>`);
  }
  if (flagKey && envKey && flagKey !== envKey) {
    throw new CliError("KeyConflict", `--key and ${KEY_ENV} hold different keys.`, `Pass only one. ${KEY_ENV} is preferred: it keeps the key out of shell history.`);
  }
  const key = envKey ?? flagKey;
  if (!key) {
    throw new CliError(
      "KeyMissing",
      "No agent key given.",
      `Most agents should run \`aidr setup\`, which makes a key for them. To use a key you already have: export ${KEY_ENV}=0x<the agent's own private key> && aidr init --wallet <walletId>. Never use the wallet owner's key.`,
    );
  }
  if (!envKey) {
    note(`Tip: pass the key in ${KEY_ENV} instead of --key so it stays out of your shell history.`);
  }
  return key;
}

function parseAddressOption(value: string, flag: string): Address {
  const v = value.trim();
  if (!isAddress(v)) {
    throw new CliError("InvalidAddress", `${flag} "${value}" is not a valid address.`, "Pass a 0x-prefixed 20-byte address (check the checksum if it's mixed-case).");
  }
  return getAddress(v);
}

function parseRpc(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new CliError("InvalidRpcUrl", `--rpc "${value}" is not a URL.`, "Pass an http(s) URL, e.g. --rpc https://rpc.testnet.arc.io");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new CliError("InvalidRpcUrl", `--rpc must be an http(s) URL, got ${url.protocol}`, "Pass an http(s) URL, e.g. --rpc https://rpc.testnet.arc.io");
  }
  return value.trim();
}

type TargetOptions = Pick<InitOptions, "network" | "mainnet" | "contract" | "rpc" | "deployBlock">;

interface Target {
  network: NetworkPreset;
  contract: Address;
  deployBlock: number;
  rpcUrl: string;
  publicClient: ReturnType<typeof makePublicClient>;
}

/** Resolves the network and contract from the options and checks the RPC and contract answer. */
async function resolveTarget(opts: TargetOptions): Promise<Target> {
  const network = resolveNetwork(opts);

  let contract: Address;
  if (opts.contract !== undefined) {
    contract = parseAddressOption(opts.contract, "--contract");
  } else if (network.defaultContract) {
    contract = getAddress(network.defaultContract);
  } else {
    throw new CliError(
      "ContractRequired",
      `Aider has no default deployment on ${network.label} (${network.name}) yet, so --contract is required.`,
      `Pass --network ${network.name} --contract <Aider contract address>`,
    );
  }
  if (isAddressEqual(contract, zeroAddress) || isAddressEqual(contract, USDC_ADDRESS)) {
    throw new CliError("InvalidAddress", `${contract} is not an Aider contract.`, "Pass the Aider contract address with --contract.");
  }

  let deployBlock: number;
  if (opts.deployBlock !== undefined) {
    const d = opts.deployBlock.trim();
    if (!/^\d+$/.test(d) || !Number.isSafeInteger(Number(d))) {
      throw new CliError("InvalidDeployBlock", `--deploy-block "${opts.deployBlock}" is not a block number.`, "Pass the block the contract was deployed in, e.g. --deploy-block 69187895.");
    }
    deployBlock = Number(d);
  } else {
    const isDefault = network.defaultContract !== undefined && isAddressEqual(contract, network.defaultContract);
    deployBlock = isDefault ? (network.defaultDeployBlock ?? 0) : 0;
  }

  const rpcUrl = opts.rpc !== undefined ? parseRpc(opts.rpc) : network.rpcUrl;
  const chain = chainFor(network.chainId, rpcUrl, network.explorerUrl);
  const publicClient = makePublicClient(chain, rpcUrl);

  // 1. The RPC must answer, and be on the chain this network expects.
  let chainId: number;
  try {
    chainId = await publicClient.getChainId();
  } catch (err) {
    const d = decodeError(err);
    throw new CliError(
      "RpcUnreachable",
      `Couldn't reach the ${network.label} RPC at ${rpcUrl}${d.detail ? ` (${d.detail})` : ""}. Nothing was saved.`,
      "Check the internet connection, or pass a working RPC with --rpc <url>.",
    );
  }
  if (chainId !== network.chainId) {
    throw new CliError(
      "ChainMismatch",
      `The RPC at ${rpcUrl} is chain ${chainId}, but ${network.label} is chain ${network.chainId}. Nothing was saved.`,
      "Use the RPC that matches --network, or the --network that matches the RPC.",
    );
  }

  // 2. There must be a contract at the address.
  let code: Hex | undefined;
  try {
    code = await publicClient.getCode({ address: contract });
  } catch (err) {
    const d = decodeError(err);
    throw new CliError("RpcUnreachable", `Couldn't read ${contract} from ${rpcUrl}${d.detail ? ` (${d.detail})` : ""}. Nothing was saved.`, "Try again, or pass a working RPC with --rpc <url>.");
  }
  if (!code || code === "0x") {
    throw new CliError(
      "NoContractCode",
      `There is no contract at ${contract} on ${network.label}. Nothing was saved.`,
      network.defaultContract
        ? `Check --contract and --network. The default ${network.label} contract is ${getAddress(network.defaultContract)}.`
        : "Check --contract and --network.",
    );
  }

  return { network, contract, deployBlock, rpcUrl, publicClient };
}

function parseWalletId(raw: string): bigint {
  const v = raw.trim();
  if (!/^\d+$/.test(v) || BigInt(v) === 0n) {
    throw new CliError("InvalidWalletId", `--wallet "${raw}" is not a wallet id.`, "Wallet ids are whole numbers starting at 1, e.g. --wallet 1.");
  }
  return BigInt(v);
}

/** Reads the wallet and agent, checks the key isn't the owner's, and collects warnings. */
async function inspect(t: Target, walletId: bigint, agentAddress: Address) {
  const { publicClient, contract, rpcUrl } = t;
  // It must behave like Aider, and tell us about this wallet and agent.
  const [wallet, agent, now, version] = await Promise.all([
    readWallet(publicClient, contract, walletId),
    readAgent(publicClient, contract, walletId, agentAddress),
    chainNow(publicClient),
    detectVersion(publicClient, contract),
  ]).catch((err: unknown) => {
    const d = decodeError(err);
    if (d.kind === "rpc") {
      const e = explainError(d, { rpcUrl });
      throw new CliError("RpcUnreachable", `${e.message} Nothing was saved.`, e.hint);
    }
    throw new CliError(
      "NotAnAiderContract",
      `The contract at ${contract} doesn't answer like an Aider contract (${d.name}). Nothing was saved.`,
      "Check --contract: it must be the Aider contract address.",
    );
  });

  if (wallet.owner !== zeroAddress && isAddressEqual(wallet.owner, agentAddress)) {
    throw new CliError(
      "OwnerKeyNotAllowed",
      `This key is the OWNER of wallet #${walletId}. aidr must run with a separate agent key, never the owner's key. Nothing was saved.`,
      "Create a new key for the agent, add its address as an agent in the Aider app, and use that key here.",
    );
  }

  const warnings: string[] = [];
  if (wallet.owner === zeroAddress) {
    warnings.push(`Wallet #${walletId} doesn't exist on this contract yet. Check the wallet id with the owner.`);
  } else {
    const n = agentStatusNote(agent, now, agentAddress, walletId);
    if (n) warnings.push(n);
    if (wallet.paused) warnings.push(`Wallet #${walletId} is paused: payments are blocked until the owner resumes it.`);
  }

  return { wallet, agent, now, version, warnings };
}

export async function cmdInit(opts: InitOptions): Promise<void> {
  const walletId = parseWalletId(opts.wallet);
  const key = resolveKey(opts);
  const agentAddress = privateKeyToAccount(key).address;
  const target = await resolveTarget(opts);
  const { network, contract, deployBlock, rpcUrl } = target;
  const { wallet, agent, now, version, warnings } = await inspect(target, walletId, agentAddress);

  const cfg: AidrConfig = {
    version: 1,
    network: network.name,
    networkName: network.label,
    chainId: network.chainId,
    rpcUrl,
    explorerUrl: network.explorerUrl,
    contract,
    deployBlock,
    walletId: walletId.toString(),
    agentAddress,
  };
  saveConfig(cfg, key);

  const status = agentStatus(agent, now);
  emit(
    {
      status: "configured",
      network: network.name,
      networkName: network.label,
      chainId: network.chainId,
      rpcUrl,
      contract,
      contractVersion: version,
      deployBlock,
      walletId: walletId.toString(),
      agentAddress,
      agentStatus: wallet.owner === zeroAddress ? "not_added" : status,
      configFile: configPath(),
      keyFile: keyPath(),
      warnings,
    },
    [
      `Configured agent ${agentAddress} on wallet #${walletId} (${network.label}). Key saved to ${keyPath()} (mode 600).`,
      ...warnings.map((w) => `Warning: ${w}`),
    ].join("\n"),
  );
}

export interface SetupOptions extends TargetOptions {
  wallet?: string;
  name?: string;
  app?: string;
}

/**
 * One-step setup on the agent's machine: makes the agent's own key (or keeps the saved one), saves
 * the config and prints a link the owner opens to add this agent. Nobody copies a key.
 */
export async function cmdSetup(opts: SetupOptions): Promise<void> {
  const walletId = opts.wallet !== undefined ? parseWalletId(opts.wallet) : undefined;
  const name = (opts.name ?? "").trim().slice(0, 48) || "AI agent";
  const appUrl = resolveAppUrl(opts.app);

  const saved = readSavedKey();
  const fromEnv = process.env[KEY_ENV]?.trim() ? normalizeKey(process.env[KEY_ENV]) : undefined;
  registerSecret(process.env[KEY_ENV]);
  if (fromEnv === null) {
    throw new CliError("KeyInvalid", `${KEY_ENV} is not a valid private key (expected 64 hex characters, 0x optional).`, `Unset it to let aidr make a new key: unset ${KEY_ENV}`);
  }
  if (fromEnv && saved && fromEnv !== saved) {
    throw new CliError(
      "KeyConflict",
      `${KEY_ENV} holds a different key from the one saved in ${keyPath()}.`,
      `Unset ${KEY_ENV} to keep the saved agent, or run \`aidr reset --yes\` first to replace it.`,
    );
  }
  const key = fromEnv ?? saved ?? generatePrivateKey();
  registerSecret(key);
  const created = !fromEnv && !saved;
  const agentAddress = privateKeyToAccount(key).address;

  const target = await resolveTarget(opts);
  const { network, contract, deployBlock, rpcUrl, publicClient } = target;
  const link = connectLink({ appUrl, agent: agentAddress, name, chainId: network.chainId, contract });

  // Same agent and contract as before: keep the block we started looking from.
  const prev = tryLoadConfig();
  const same = prev && isAddressEqual(prev.agentAddress, agentAddress) && isAddressEqual(prev.contract, contract) && prev.chainId === network.chainId;
  let setupBlock = same && prev.setupBlock !== undefined ? prev.setupBlock : undefined;
  if (setupBlock === undefined) {
    try {
      setupBlock = Number(await publicClient.getBlockNumber());
    } catch (err) {
      const d = decodeError(err);
      throw new CliError("RpcUnreachable", `Couldn't read the latest block from ${rpcUrl}${d.detail ? ` (${d.detail})` : ""}. Nothing was saved.`, "Try again, or pass a working RPC with --rpc <url>.");
    }
  }

  let linkedWallet = walletId ?? (same && prev.walletId ? BigInt(prev.walletId) : undefined);
  let agentState: string = "not_added";
  const warnings: string[] = [];
  if (linkedWallet !== undefined) {
    const r = await inspect(target, linkedWallet, agentAddress);
    agentState = r.wallet.owner === zeroAddress ? "not_added" : agentStatus(r.agent, r.now);
    if (walletId !== undefined || agentState === "active") warnings.push(...r.warnings);
    // A remembered wallet that no longer has this agent: look again on first use.
    if (walletId === undefined && agentState !== "active") linkedWallet = undefined;
  }

  const cfg: AidrConfig = {
    version: 1,
    network: network.name,
    networkName: network.label,
    chainId: network.chainId,
    rpcUrl,
    explorerUrl: network.explorerUrl,
    contract,
    deployBlock,
    walletId: linkedWallet?.toString() ?? "",
    agentAddress,
    setupBlock,
    connectLink: link,
  };
  saveConfig(cfg, key);

  const connected = agentState === "active";
  emit(
    {
      status: connected ? "connected" : "waiting_for_owner",
      agentAddress,
      name,
      connectLink: link,
      walletId: linkedWallet?.toString() ?? null,
      agentStatus: agentState,
      keyCreated: created,
      network: network.name,
      networkName: network.label,
      contract,
      configFile: configPath(),
      keyFile: keyPath(),
      next: connected ? "aidr balance" : "Give connectLink to the wallet owner. Once they add the agent, run: aidr balance",
      warnings,
    },
    [
      created ? `Created a new key for this agent. It is saved in ${keyPath()} (mode 600) and never leaves this machine.` : `Using this machine's agent key (${keyPath()}).`,
      `Agent address: ${agentAddress}`,
      "",
      connected
        ? `Connected to wallet #${linkedWallet} on ${network.label}. Run: aidr balance`
        : `Open this link where your Aider wallet is, set the limits and click Add agent:\n\n  ${link}\n\nThen run: aidr balance`,
      ...warnings.map((w) => `Warning: ${w}`),
    ].join("\n"),
  );
}

/** Deletes this machine's agent key and config. */
export function cmdReset(opts: { yes?: boolean }): void {
  const files = [keyPath(), configPath()].filter((f) => existsSync(f));
  if (files.length === 0) {
    emit({ status: "nothing_to_reset", configDir: configDir() }, "aidr isn't set up on this machine; nothing to delete.");
    return;
  }
  const cfg = tryLoadConfig();
  if (!opts.yes) {
    throw new CliError(
      "ConfirmationRequired",
      `This deletes the agent key${cfg ? ` for ${cfg.agentAddress}` : ""} from this machine. The key can't be recovered, and USDC left on the agent's address for gas becomes unreachable.`,
      "Run `aidr reset --yes` to delete it. To stop the agent from paying, the owner can also revoke it in the Aider app.",
    );
  }
  for (const f of files) rmSync(f, { force: true });
  emit(
    { status: "reset", agentAddress: cfg?.agentAddress ?? null, deleted: files },
    `Deleted ${files.join(" and ")}. The owner should also revoke ${cfg?.agentAddress ?? "this agent"} in the Aider app.`,
  );
}
