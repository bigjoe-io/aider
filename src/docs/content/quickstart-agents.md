---
title: Quickstart for agents
summary: Install aidr on the agent's machine, connect it to a wallet and make a first payment.
group: Get started
order: 3
meta: Runs on=The agent's machine | Needs=Node 18+ and bun | Output=One JSON object per command
tags: cli-reference, skill-md, errors
---

## 1. Install the CLI

The CLI lives in the `cli/` folder of the Aider repository.

```bash title="Terminal"
cd cli
bun install
bun run build
npm link        # makes the `aidr` command available
aidr --help
```

## 2. Configure it

The wallet owner gives you a wallet id and the agent's own private key. Put the key in an environment variable so it stays out of your shell history, then run `init`:

```bash title="Terminal"
export AIDR_AGENT_KEY=0x…      # the agent's key, never the owner's
aidr init --wallet 1
```

On Arc Testnet that's all. Arc mainnet has no default contract yet, so pass it:

```bash title="Terminal"
aidr init --wallet 1 --network mainnet --contract 0x…
```

`init` checks that the RPC answers on the right chain and that the address really holds an Aider contract. It refuses the owner's key and warns if your key hasn't been added to the wallet yet. It saves `~/.aidr/config.json` and `~/.aidr/key` with private file permissions and never prints the key.

The agent's address also needs a little USDC of its own to pay gas. Payments themselves come from the Aider wallet.

## 3. Check the budget

```bash title="Terminal"
aidr balance
```

Look at `agent.status` (it must be `active`) and `maxDirectPayment`, the largest payment that goes through right now without approval.

## 4. Pay

```bash title="Terminal"
aidr pay 0x8f3…a21 0.05 "API credits for the weather lookup"
```

Within the limits you get `"status": "paid"` with a transaction hash and an explorer link. If the amount is over the per-payment or daily limit, `aidr` creates an approval request instead:

```json title="aidr pay 0x8f3…a21 1.00 'Premium dataset'"
{ "status": "pending_approval", "requestId": "42", "reason": "OverPerPaymentLimit",
  "amount": "1.00", "expiresAt": "2026-10-26T18:01:38.000Z", "ttlMinutes": 30 }
```

The payment is **not** made yet. Tell the user, then wait for the owner:

```bash title="Terminal"
aidr wait 42 --timeout 1.5
```

`wait` prints the request once it's approved, rejected or expired. Set `--timeout` below your own command timeout and call it again if needed.

## 5. Give the rules to your coding agent

If the agent is an AI coding tool such as Claude Code, give it [SKILL.md](/docs/skill-md). It tells the agent when to check its balance, how to read each result and what never to do.

## Next

See the [CLI reference](/docs/cli-reference) for every command and flag, and [errors](/docs/errors) for what each failure means.
