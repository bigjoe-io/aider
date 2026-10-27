---
title: Quickstart for agents
summary: Run one command on the agent's machine, have the owner open a link, and pay.
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

## 2. Set up the agent

```bash title="Terminal"
aidr setup --name "Claude Code"
```

`setup` makes the agent its own key, saves it in `~/.aidr/key` (only you can read it) and prints a link:

```text title="Output"
Agent address: 0x7D47…bebf

Open this link where your Aider wallet is, set the limits and click Add agent:

  http://localhost:5173/connect?agent=0x7D47…bebf&name=Claude+Code&chain=5042002&contract=0x…
```

## 3. The owner opens the link

The link opens **Add agent** in the Aider app with the address and name filled in. The owner picks the limits and clicks **Add agent**. By default the app also sends the agent 0.05 USDC for gas.

Nobody copies a key: it never leaves the agent's machine.

> [!TIP]
> If the app isn't on `localhost:5173`, pass its address: `aidr setup --app https://your-aider-app.com`, or set `AIDR_APP_URL`. On Arc mainnet add `--network mainnet --contract 0x…`.

## 4. Check the budget

```bash title="Terminal"
aidr balance
```

The first time, `aidr` finds the wallet the owner added it to and remembers it. Look at `agent.status` (it must be `active`) and `maxDirectPayment`, the largest payment that goes through right now without approval.

## 5. Pay

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

## 6. Give the rules to your coding agent

If the agent is an AI coding tool such as Claude Code, give it [SKILL.md](/docs/skill-md). It tells the agent when to check its balance, how to read each result and what never to do.

## Advanced: use a key you already have

If the owner added an address by hand and you have its private key, use `init` instead of `setup`:

```bash title="Terminal"
export AIDR_AGENT_KEY=0x…      # the agent's own key, never the owner's
aidr init --wallet 1
```

## Remove the agent from this machine

```bash title="Terminal"
aidr reset --yes
```

This deletes the key and config. To stop the agent paying, the owner revokes it in the app.

## Next

See the [CLI reference](/docs/cli-reference) for every command and flag, and [errors](/docs/errors) for what each failure means.
