#!/usr/bin/env node
import { Command } from "commander";
import { cmdInit }    from "./commands/init.js";
import { cmdBalance } from "./commands/balance.js";
import { cmdPay }     from "./commands/pay.js";
import { cmdStatus }  from "./commands/status.js";
import { cmdWait }    from "./commands/wait.js";
import { cmdHistory } from "./commands/history.js";

const program = new Command();

program
  .name("leash")
  .description("USDC spending CLI for AI agents — powered by Leash on Arc")
  .version("0.1.0");

// ── leash init ────────────────────────────────────────────────────────────────
program
  .command("init")
  .description("Save agent config and key to ~/.leash/ (mode 600)")
  .requiredOption("--wallet <walletId>", "Leash wallet ID (number)")
  .requiredOption("--key <privateKey>",  "Agent private key (hex, stored at ~/.leash/key, never printed)")
  .option("--contract <address>",        "Leash contract address (default: Arc Testnet deployment)")
  .option("--mainnet",                   "Target Arc Mainnet instead of Arc Testnet")
  .action(async (opts: { wallet: string; key: string; contract?: string; mainnet?: boolean }) => {
    await cmdInit(opts);
  });

// ── leash balance ─────────────────────────────────────────────────────────────
program
  .command("balance")
  .description("Show wallet available balance and this agent's limits")
  .action(async () => {
    await cmdBalance();
  });

// ── leash pay ─────────────────────────────────────────────────────────────────
program
  .command("pay <to> <amount> <memo>")
  .description('Pay from the wallet. Automatically requests approval if over a limit.')
  .option("--no-request", "Disable automatic fallback to requestPayment on limit errors")
  .action(async (to: string, amount: string, memo: string, opts: { request: boolean }) => {
    await cmdPay(to, amount, memo, { noRequest: !opts.request });
  });

// ── leash status ──────────────────────────────────────────────────────────────
program
  .command("status <requestId>")
  .description("Check the status of a payment request")
  .action(async (requestId: string) => {
    await cmdStatus(requestId);
  });

// ── leash wait ────────────────────────────────────────────────────────────────
program
  .command("wait <requestId>")
  .description("Poll until a payment request is resolved or expired")
  .action(async (requestId: string) => {
    await cmdWait(requestId);
  });

// ── leash history ─────────────────────────────────────────────────────────────
program
  .command("history")
  .description("Show this agent's recent payments with explorer links")
  .action(async () => {
    await cmdHistory();
  });

// ── global error handling ─────────────────────────────────────────────────────
program.exitOverride();

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if ((err as { code?: string }).code === "commander.helpDisplayed") process.exit(0);
    if ((err as { code?: string }).code === "commander.version")       process.exit(0);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\nError: ${msg}`);
    process.exit(1);
  }
}

main();
