import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { getAddress, isAddress, isHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CliError } from "./errors.js";
import { note, registerSecret } from "./output.js";
export function configDir() {
    return join(homedir(), ".aidr");
}
export function configPath() {
    return join(configDir(), "config.json");
}
export function keyPath() {
    return join(configDir(), "key");
}
const SETUP_HINT = "Run on the agent's machine: export AIDR_AGENT_KEY=0x<the agent's private key> && aidr init --wallet <walletId>";
/** Normalises a private key ("0x" optional, 64 hex chars) or returns null. Never echoes it. */
export function normalizeKey(raw) {
    const k = raw.trim();
    const hex = k.startsWith("0x") || k.startsWith("0X") ? `0x${k.slice(2)}` : `0x${k}`;
    if (hex.length !== 66 || !isHex(hex, { strict: true }))
        return null;
    try {
        privateKeyToAccount(hex);
        return hex.toLowerCase();
    }
    catch {
        return null;
    }
}
function writePrivate(path, content) {
    // Write a fresh 0600 file and rename it over the old one, so the file never exists with wider permissions.
    const tmp = `${path}.tmp-${process.pid}`;
    writeFileSync(tmp, content, { mode: 0o600 });
    chmodSync(tmp, 0o600);
    renameSync(tmp, path);
    chmodSync(path, 0o600);
}
export function saveConfig(cfg, key) {
    const dir = configDir();
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    chmodSync(dir, 0o700);
    writePrivate(keyPath(), `${key}\n`);
    writePrivate(configPath(), `${JSON.stringify(cfg, null, 2)}\n`);
}
export function loadConfig() {
    const path = configPath();
    if (!existsSync(path)) {
        throw new CliError("NotConfigured", "aidr isn't set up on this machine yet (no ~/.aidr/config.json).", SETUP_HINT);
    }
    let raw;
    try {
        raw = JSON.parse(readFileSync(path, "utf8"));
    }
    catch {
        throw new CliError("ConfigInvalid", `${path} is not valid JSON.`, SETUP_HINT);
    }
    const c = raw;
    const ok = typeof c.chainId === "number" &&
        typeof c.rpcUrl === "string" &&
        typeof c.explorerUrl === "string" &&
        typeof c.contract === "string" &&
        isAddress(c.contract, { strict: false }) &&
        typeof c.walletId === "string" &&
        /^\d+$/.test(c.walletId) &&
        typeof c.agentAddress === "string" &&
        isAddress(c.agentAddress, { strict: false });
    if (!ok) {
        throw new CliError("ConfigInvalid", `${path} is missing fields or was written by an older version.`, SETUP_HINT);
    }
    return {
        version: 1,
        network: typeof c.network === "string" ? c.network : "custom",
        networkName: typeof c.networkName === "string" ? c.networkName : `Chain ${c.chainId}`,
        chainId: c.chainId,
        rpcUrl: c.rpcUrl,
        explorerUrl: c.explorerUrl,
        contract: getAddress(c.contract),
        deployBlock: typeof c.deployBlock === "number" && c.deployBlock >= 0 ? c.deployBlock : 0,
        walletId: c.walletId,
        agentAddress: getAddress(c.agentAddress),
    };
}
/** Reads the agent key saved by `aidr init` and checks it matches the configured agent address. */
export function loadKey(cfg) {
    const path = keyPath();
    if (!existsSync(path)) {
        throw new CliError("KeyMissing", "The agent key file ~/.aidr/key is missing.", SETUP_HINT);
    }
    if (process.platform !== "win32") {
        const mode = statSync(path).mode & 0o777;
        if ((mode & 0o077) !== 0) {
            note(`Warning: ${path} is readable by other users (mode ${mode.toString(8)}). Run: chmod 600 ${path}`);
        }
    }
    const raw = readFileSync(path, "utf8");
    registerSecret(raw);
    const key = normalizeKey(raw);
    if (!key) {
        throw new CliError("KeyInvalid", "~/.aidr/key doesn't contain a valid private key.", SETUP_HINT);
    }
    registerSecret(key);
    const address = privateKeyToAccount(key).address;
    if (address.toLowerCase() !== cfg.agentAddress.toLowerCase()) {
        throw new CliError("KeyMismatch", `~/.aidr/key belongs to ${address}, but the config is for agent ${cfg.agentAddress}.`, SETUP_HINT);
    }
    return key;
}
//# sourceMappingURL=config.js.map