import { getAddress, isAddress, isAddressEqual, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chainNow, detectVersion, makePublicClient, readAgent, readWallet } from "../chain.js";
import { configPath, keyPath, normalizeKey, saveConfig } from "../config.js";
import { agentStatusNote, CliError, decodeError, explainError } from "../errors.js";
import { NETWORKS, USDC_ADDRESS, chainFor } from "../networks.js";
import { emit, note, registerSecret } from "../output.js";
import { agentStatus } from "../state.js";
const KEY_ENV = "AIDR_AGENT_KEY";
function resolveNetwork(opts) {
    const requested = opts.network?.trim().toLowerCase();
    if (requested !== undefined && requested !== "testnet" && requested !== "mainnet") {
        throw new CliError("InvalidNetwork", `Unknown network "${opts.network}".`, "Use --network testnet or --network mainnet.");
    }
    if (opts.mainnet && requested === "testnet") {
        throw new CliError("InvalidNetwork", "--mainnet and --network testnet contradict each other.", "Pass only one of them.");
    }
    const name = opts.mainnet ? "mainnet" : (requested ?? "testnet");
    return NETWORKS[name];
}
function resolveKey(opts) {
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
        throw new CliError("KeyMissing", "No agent key given.", `On the agent's machine run: export ${KEY_ENV}=0x<the agent's own private key> && aidr init --wallet <walletId>. Never use the wallet owner's key.`);
    }
    if (!envKey) {
        note(`Tip: pass the key in ${KEY_ENV} instead of --key so it stays out of your shell history.`);
    }
    return key;
}
function parseAddressOption(value, flag) {
    const v = value.trim();
    if (!isAddress(v)) {
        throw new CliError("InvalidAddress", `${flag} "${value}" is not a valid address.`, "Pass a 0x-prefixed 20-byte address (check the checksum if it's mixed-case).");
    }
    return getAddress(v);
}
function parseRpc(value) {
    let url;
    try {
        url = new URL(value.trim());
    }
    catch {
        throw new CliError("InvalidRpcUrl", `--rpc "${value}" is not a URL.`, "Pass an http(s) URL, e.g. --rpc https://rpc.testnet.arc.io");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new CliError("InvalidRpcUrl", `--rpc must be an http(s) URL, got ${url.protocol}`, "Pass an http(s) URL, e.g. --rpc https://rpc.testnet.arc.io");
    }
    return value.trim();
}
export async function cmdInit(opts) {
    const walletRaw = opts.wallet.trim();
    if (!/^\d+$/.test(walletRaw) || BigInt(walletRaw) === 0n) {
        throw new CliError("InvalidWalletId", `--wallet "${opts.wallet}" is not a wallet id.`, "Wallet ids are whole numbers starting at 1, e.g. --wallet 1.");
    }
    const walletId = BigInt(walletRaw);
    const network = resolveNetwork(opts);
    const key = resolveKey(opts);
    const agentAddress = privateKeyToAccount(key).address;
    let contract;
    if (opts.contract !== undefined) {
        contract = parseAddressOption(opts.contract, "--contract");
    }
    else if (network.defaultContract) {
        contract = getAddress(network.defaultContract);
    }
    else {
        throw new CliError("ContractRequired", `Aider has no default deployment on ${network.label} (${network.name}) yet, so --contract is required.`, `Run: aidr init --wallet ${walletId} --network ${network.name} --contract <Aider contract address>`);
    }
    if (isAddressEqual(contract, zeroAddress) || isAddressEqual(contract, USDC_ADDRESS)) {
        throw new CliError("InvalidAddress", `${contract} is not an Aider contract.`, "Pass the Aider contract address with --contract.");
    }
    let deployBlock;
    if (opts.deployBlock !== undefined) {
        const d = opts.deployBlock.trim();
        if (!/^\d+$/.test(d) || !Number.isSafeInteger(Number(d))) {
            throw new CliError("InvalidDeployBlock", `--deploy-block "${opts.deployBlock}" is not a block number.`, "Pass the block the contract was deployed in, e.g. --deploy-block 69187895.");
        }
        deployBlock = Number(d);
    }
    else {
        const isDefault = network.defaultContract !== undefined && isAddressEqual(contract, network.defaultContract);
        deployBlock = isDefault ? (network.defaultDeployBlock ?? 0) : 0;
    }
    const rpcUrl = opts.rpc !== undefined ? parseRpc(opts.rpc) : network.rpcUrl;
    const chain = chainFor(network.chainId, rpcUrl, network.explorerUrl);
    const publicClient = makePublicClient(chain, rpcUrl);
    // 1. The RPC must answer, and be on the chain this network expects.
    let chainId;
    try {
        chainId = await publicClient.getChainId();
    }
    catch (err) {
        const d = decodeError(err);
        throw new CliError("RpcUnreachable", `Couldn't reach the ${network.label} RPC at ${rpcUrl}${d.detail ? ` (${d.detail})` : ""}. Nothing was saved.`, "Check the internet connection, or pass a working RPC with --rpc <url>.");
    }
    if (chainId !== network.chainId) {
        throw new CliError("ChainMismatch", `The RPC at ${rpcUrl} is chain ${chainId}, but ${network.label} is chain ${network.chainId}. Nothing was saved.`, "Use the RPC that matches --network, or the --network that matches the RPC.");
    }
    // 2. There must be a contract at the address.
    let code;
    try {
        code = await publicClient.getCode({ address: contract });
    }
    catch (err) {
        const d = decodeError(err);
        throw new CliError("RpcUnreachable", `Couldn't read ${contract} from ${rpcUrl}${d.detail ? ` (${d.detail})` : ""}. Nothing was saved.`, "Try again, or pass a working RPC with --rpc <url>.");
    }
    if (!code || code === "0x") {
        throw new CliError("NoContractCode", `There is no contract at ${contract} on ${network.label}. Nothing was saved.`, network.defaultContract
            ? `Check --contract and --network. The default ${network.label} contract is ${getAddress(network.defaultContract)}.`
            : "Check --contract and --network.");
    }
    // 3. It must behave like Aider, and tell us about this wallet and agent.
    const [wallet, agent, now, version] = await Promise.all([
        readWallet(publicClient, contract, walletId),
        readAgent(publicClient, contract, walletId, agentAddress),
        chainNow(publicClient),
        detectVersion(publicClient, contract),
    ]).catch((err) => {
        const d = decodeError(err);
        if (d.kind === "rpc") {
            const e = explainError(d, { rpcUrl });
            throw new CliError("RpcUnreachable", `${e.message} Nothing was saved.`, e.hint);
        }
        throw new CliError("NotAnAiderContract", `The contract at ${contract} doesn't answer like an Aider contract (${d.name}). Nothing was saved.`, "Check --contract: it must be the Aider contract address.");
    });
    if (wallet.owner !== zeroAddress && isAddressEqual(wallet.owner, agentAddress)) {
        throw new CliError("OwnerKeyNotAllowed", `This key is the OWNER of wallet #${walletId}. aidr must run with a separate agent key, never the owner's key. Nothing was saved.`, "Create a new key for the agent, add its address as an agent in the Aider app, and use that key here.");
    }
    const warnings = [];
    if (wallet.owner === zeroAddress) {
        warnings.push(`Wallet #${walletId} doesn't exist on this contract yet. Check the wallet id with the owner.`);
    }
    else {
        const n = agentStatusNote(agent, now, agentAddress, walletId);
        if (n)
            warnings.push(n);
        if (wallet.paused)
            warnings.push(`Wallet #${walletId} is paused: payments are blocked until the owner resumes it.`);
    }
    const cfg = {
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
    emit({
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
    }, [
        `Configured agent ${agentAddress} on wallet #${walletId} (${network.label}). Key saved to ${keyPath()} (mode 600).`,
        ...warnings.map((w) => `Warning: ${w}`),
    ].join("\n"));
}
//# sourceMappingURL=init.js.map