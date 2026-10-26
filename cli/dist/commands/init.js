import { privateKeyToAccount } from "viem/accounts";
import { saveConfig, die } from "../config.js";
// Default Arc Testnet values
const DEFAULT_CONTRACT = "0xed32e15d81e7864bf19caea4333bd0781f328ba3";
const DEFAULT_RPC = "https://rpc.testnet.arc.io";
const DEFAULT_CHAIN_ID = 5042002;
const DEFAULT_EXPLORER = "https://explorer.testnet.arc.io";
const MAINNET_RPC = "https://rpc.mainnet.arc.io";
const MAINNET_CHAIN_ID = 5042;
const MAINNET_EXPLORER = "https://explorer.arc.io";
export async function cmdInit(opts) {
    const { wallet, key, contract, mainnet } = opts;
    if (!wallet || !key) {
        die("Both --wallet and --key are required.\nExample: leash init --wallet 1 --key 0xabc...");
    }
    let walletId;
    try {
        walletId = BigInt(wallet);
    }
    catch {
        die(`Invalid wallet ID "${wallet}". Must be a number.`);
    }
    // Derive agent address from key (never print the key)
    let agentAddress;
    try {
        const normalized = key.startsWith("0x") ? key : `0x${key}`;
        const account = privateKeyToAccount(normalized);
        agentAddress = account.address;
    }
    catch {
        die("Invalid private key. Must be a 32-byte hex string.");
    }
    const rpcUrl = mainnet ? MAINNET_RPC : DEFAULT_RPC;
    const chainId = mainnet ? MAINNET_CHAIN_ID : DEFAULT_CHAIN_ID;
    const explorerUrl = mainnet ? MAINNET_EXPLORER : DEFAULT_EXPLORER;
    const contractAddr = contract ?? DEFAULT_CONTRACT;
    saveConfig(walletId, agentAddress, key, contractAddr, rpcUrl, chainId, explorerUrl);
    const result = {
        status: "configured",
        walletId: walletId.toString(),
        agentAddress,
        contractAddress: contractAddr,
        network: mainnet ? "Arc Mainnet" : "Arc Testnet",
        configSaved: "~/.leash/config.json (mode 600)",
        keySaved: "~/.leash/key (mode 600, never printed)",
    };
    console.log(JSON.stringify(result, null, 2));
    console.log(`\nConfigured. Agent ${agentAddress} on wallet #${walletId}. Key stored at ~/.leash/key.`);
}
//# sourceMappingURL=init.js.map