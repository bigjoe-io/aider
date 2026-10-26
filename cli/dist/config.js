import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "fs";
import { homedir } from "os";
import { join } from "path";
const CONFIG_DIR = join(homedir(), ".leash");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const KEY_FILE = join(CONFIG_DIR, "key");
// ── write ─────────────────────────────────────────────────────────────────────
export function saveConfig(walletId, agentAddress, privateKey, contractAddress, rpcUrl, chainId, explorerUrl) {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    }
    const stored = {
        walletId: walletId.toString(),
        agentAddress: agentAddress.toLowerCase(),
        contractAddress,
        rpcUrl,
        chainId,
        explorerUrl,
    };
    writeFileSync(CONFIG_FILE, JSON.stringify(stored, null, 2), { mode: 0o600 });
    // Private key in a separate file — never mixed into config output
    const normalized = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    writeFileSync(KEY_FILE, normalized, { mode: 0o600 });
    // Ensure permissions even if file already existed
    chmodSync(CONFIG_FILE, 0o600);
    chmodSync(KEY_FILE, 0o600);
}
// ── read ──────────────────────────────────────────────────────────────────────
export function loadConfig() {
    if (!existsSync(CONFIG_FILE)) {
        die("No config found. Run:\n  leash init --wallet <walletId> --key <agentPrivateKey> [--contract <addr>]");
    }
    const raw = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
    return {
        walletId: BigInt(raw.walletId),
        agentAddress: raw.agentAddress,
        contractAddress: raw.contractAddress,
        rpcUrl: raw.rpcUrl,
        chainId: raw.chainId,
        explorerUrl: raw.explorerUrl,
    };
}
export function loadPrivateKey() {
    if (!existsSync(KEY_FILE)) {
        die("Key file missing. Re-run `leash init` to reconfigure.");
    }
    const key = readFileSync(KEY_FILE, "utf8").trim();
    return key;
}
// ── helpers ───────────────────────────────────────────────────────────────────
export function die(msg) {
    console.error(`\nError: ${msg}\n`);
    process.exit(1);
}
//# sourceMappingURL=config.js.map