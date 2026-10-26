#!/usr/bin/env node
import { Command, CommanderError } from "commander";
import { cmdBalance } from "./commands/balance.js";
import { cmdHistory } from "./commands/history.js";
import { cmdInit } from "./commands/init.js";
import { cmdPay } from "./commands/pay.js";
import { cmdStatus } from "./commands/status.js";
import { cmdWait } from "./commands/wait.js";
import { CliError, decodeError, explainError } from "./errors.js";
import { emitError, hasEmitted, note } from "./output.js";
const VERSION = "0.2.0";
const program = new Command();
program
    .name("aidr")
    .description("Aider CLI: pay USDC from an Aider wallet on Arc, inside the limits the wallet owner set.\n" +
    "Every command prints one JSON object on stdout and a short human line on stderr.")
    .version(VERSION)
    .allowExcessArguments(false)
    .exitOverride()
    .configureOutput({ outputError: (str, write) => write(str) });
program
    .command("init")
    .description("Set up this machine's agent (run on the agent's machine). Key from AIDR_AGENT_KEY (recommended) or --key.")
    .requiredOption("--wallet <id>", "Aider wallet id (a number)")
    .option("--key <hex>", "agent private key (prefer the AIDR_AGENT_KEY env var: keeps it out of shell history)")
    .option("--network <name>", "testnet (default) or mainnet")
    .option("--mainnet", "same as --network mainnet")
    .option("--contract <address>", "Aider contract address (required on mainnet; testnet defaults to the public deployment)")
    .option("--rpc <url>", "RPC URL (default: the network's public RPC)")
    .option("--deploy-block <n>", "block the contract was deployed in (history never scans below it)")
    .action(async (opts) => {
    await cmdInit(opts);
});
program
    .command("balance")
    .description("Wallet balance and this agent's status, limits and what it can still spend today")
    .action(async () => {
    await cmdBalance();
});
program
    .command("pay")
    .description("Pay <to> <amount> USDC. Over a limit, it creates an approval request instead (unless --no-request).")
    .argument("<to>", "recipient address")
    .argument("<amount>", "USDC amount, e.g. 0.05 or '$0.05' (max 6 decimals)")
    .argument("<memo>", "what the payment is for (the owner reads it)")
    .option("--no-request", "fail instead of creating an approval request when over a limit")
    .option("--ttl <minutes>", "how long the owner has to approve a request (1-10080, default 30)")
    .option("--send-anyway", "skip the pre-flight check and broadcast even if it will be rejected, so the rejection is recorded onchain (costs gas)")
    .action(async (to, amount, memo, opts) => {
    await cmdPay(to, amount, memo, opts);
});
program
    .command("status")
    .description("Status of an approval request: pending | approved | rejected | expired")
    .argument("<requestId>", "request id from `aidr pay`")
    .action(async (requestId) => {
    await cmdStatus(requestId);
});
program
    .command("wait")
    .description("Wait (checking every 5 s) until a request is approved, rejected or expired")
    .argument("<requestId>", "request id from `aidr pay`")
    .option("--timeout <minutes>", "give up after this many minutes (exit 1)")
    .action(async (requestId, opts) => {
    await cmdWait(requestId, opts);
});
program
    .command("history")
    .description("This agent's recent payments from the wallet, newest first")
    .option("--limit <n>", "how many payments to show (default 20)")
    .option("--blocks <n>", "how many recent blocks to scan (default 500000)")
    .action(async (opts) => {
    await cmdHistory(opts);
});
async function main() {
    try {
        await program.parseAsync(process.argv);
    }
    catch (err) {
        if (err instanceof CommanderError) {
            if (err.code === "commander.helpDisplayed" || err.code === "commander.version" || err.code === "commander.help") {
                process.exitCode = err.exitCode;
                return;
            }
            emitError("UsageError", err.message.replace(/^error:\s*/i, ""), "Run `aidr --help` or `aidr <command> --help`.");
            return;
        }
        if (hasEmitted()) {
            note(`Error after output: ${err instanceof Error ? err.message : String(err)}`);
            process.exitCode = 1;
            return;
        }
        if (err instanceof CliError) {
            emitError(err.code, err.message, err.hint, err.extra);
            return;
        }
        const d = decodeError(err);
        const e = explainError(d);
        emitError(d.name, e.message, e.hint);
    }
}
await main();
// Don't let idle keep-alive sockets hold the process open after the result is printed.
setTimeout(() => process.exit(), 1_000).unref();
//# sourceMappingURL=index.js.map