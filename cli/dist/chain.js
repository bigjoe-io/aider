import { createPublicClient, createWalletClient, http, publicActions, } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet, arc } from "viem/chains";
import { loadConfig, loadPrivateKey, die } from "./config.js";
import { LEASH_ABI } from "./abi.js";
// ── custom error selectors (keccak256 first 4 bytes) ─────────────────────────
export const ERROR_SELECTORS = {
    "0x3c1bfd9e": "WalletPaused",
    "0x3d4fa12a": "AgentRevokedError",
    "0x8af8ae35": "AgentExpired",
    "0x29c9d28e": "AgentNotActive",
    "0x53c98e2e": "OverPerPaymentLimit",
    "0x1f2a2005": "OverDailyLimit",
    "0xf4d678b8": "InsufficientBalance",
    "0xd92e233d": "ZeroAddress",
    "0x6c7bcc15": "RecipientNotAllowed",
    "0x55b6cf7f": "RecipientBlocked",
};
// Errors that trigger automatic requestPayment fallback
export const LIMIT_ERRORS = new Set(["OverPerPaymentLimit", "OverDailyLimit", "InsufficientBalance"]);
// ── chain resolution ──────────────────────────────────────────────────────────
function resolveChain(chainId, rpcUrl) {
    const base = chainId === 5042
        ? arc
        : chainId === 5042002
            ? arcTestnet
            : {
                id: chainId,
                name: `Chain ${chainId}`,
                nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
                rpcUrls: { default: { http: [rpcUrl] } },
            };
    // Always override the RPC with the user-configured URL
    return {
        ...base,
        rpcUrls: { ...base.rpcUrls, default: { http: [rpcUrl] } },
    };
}
export function buildClients() {
    const cfg = loadConfig();
    const privateKey = loadPrivateKey();
    const account = privateKeyToAccount(privateKey);
    if (account.address.toLowerCase() !== cfg.agentAddress.toLowerCase()) {
        die(`Key mismatch: key corresponds to ${account.address} but config says agent is ${cfg.agentAddress}.\nRe-run \`leash init\` to fix.`);
    }
    const chain = resolveChain(cfg.chainId, cfg.rpcUrl);
    const publicClient = createPublicClient({
        chain,
        transport: http(cfg.rpcUrl),
    });
    const walletClient = createWalletClient({
        account,
        chain,
        transport: http(cfg.rpcUrl),
    }).extend(publicActions);
    return {
        publicClient,
        walletClient,
        account,
        contractAddress: cfg.contractAddress,
        walletId: BigInt(cfg.walletId),
        agentAddress: cfg.agentAddress,
        explorerUrl: cfg.explorerUrl,
    };
}
// ── contract helpers ──────────────────────────────────────────────────────────
export async function readWallet(clients) {
    const result = await clients.publicClient.readContract({
        address: clients.contractAddress,
        abi: LEASH_ABI,
        functionName: "getWallet",
        args: [clients.walletId],
    });
    return {
        balance: result[1],
        reserved: result[2],
        available: result[3],
        paused: result[4],
        mode: result[5],
    };
}
export async function readAgent(clients) {
    const result = await clients.publicClient.readContract({
        address: clients.contractAddress,
        abi: LEASH_ABI,
        functionName: "getAgent",
        args: [clients.walletId, clients.agentAddress],
    });
    return {
        label: result[0],
        perPaymentLimit: result[1],
        dailyLimit: result[2],
        expiresAt: result[3],
        active: result[4],
        spentToday: result[5],
        dayStart: result[6],
    };
}
export async function readRequest(clients, requestId) {
    const r = await clients.publicClient.readContract({
        address: clients.contractAddress,
        abi: LEASH_ABI,
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
// ── error decoding ────────────────────────────────────────────────────────────
export function decodeRevertError(err) {
    const msg = String(err);
    // viem encodes custom errors in the message
    for (const [selector, name] of Object.entries(ERROR_SELECTORS)) {
        if (msg.includes(selector) || msg.includes(name))
            return name;
    }
    // Fallback: extract the error name from viem's ContractFunctionRevertedError
    const match = msg.match(/Error: (\w+)\(/);
    if (match)
        return match[1];
    return "UnknownError";
}
// ── formatting helpers ────────────────────────────────────────────────────────
export const USDC_DECIMALS = 6n;
export const USDC_SCALE = 10n ** USDC_DECIMALS;
export function formatUsdc(raw) {
    const whole = raw / USDC_SCALE;
    const frac = raw % USDC_SCALE;
    return `$${whole}.${frac.toString().padStart(6, "0").slice(0, 2)}`;
}
export function parseUsdc(str) {
    // Accept "1.50", "1", ".50"
    const clean = str.replace(/^\$/, "");
    const [whole = "0", frac = "0"] = clean.split(".");
    const fracPadded = frac.slice(0, 6).padEnd(6, "0");
    return BigInt(whole) * USDC_SCALE + BigInt(fracPadded);
}
export const REQUEST_STATUS = {
    0: "pending",
    1: "approved",
    2: "rejected",
    3: "expired",
};
export function txUrl(explorerUrl, txHash) {
    return `${explorerUrl.replace(/\/$/, "")}/tx/${txHash}`;
}
export function addrUrl(explorerUrl, address) {
    return `${explorerUrl.replace(/\/$/, "")}/address/${address}`;
}
//# sourceMappingURL=chain.js.map