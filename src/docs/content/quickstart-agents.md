---
title: Agent guide
summary: Install aidr, connect the agent and pay, as short steps.
group: Get started
order: 4
meta: Runs on=The agent's computer | Needs=Node 18 or newer | Output=One JSON object per command
tags: quickstart, cli-reference, use-with-claude
---

## Install

```bash title="Terminal"
npm install -g aidr-cli
aidr --version
```

To update later, run `npm install -g aidr-cli@latest`.

## Connect to a wallet

```bash title="Terminal"
aidr setup --name "Claude Code"
```

1. `aidr` makes the agent its own key and keeps it on this computer (in `~/.aidr/key`). It never prints it.
2. It prints a link. The wallet owner opens it, chooses the limits and clicks **Add agent**.
3. Run `aidr balance`. The first time, it finds the wallet by itself.

Until the owner adds the agent, commands answer `NotLinked` and show the link again.

## Check the budget

```bash title="Terminal"
aidr balance
```

| Field | What to look at |
|---|---|
| `agent.status` | Must be `active` to pay. |
| `maxDirectPayment` | The biggest payment that goes through right now without approval. |
| `agent.remainingToday` | What's left of today's limit. |

## Pay

```bash title="Terminal"
aidr pay <address> <amount> "<what it's for>"
```

```bash title="Example"
aidr pay 0x90F79bf6EB2c4f870365E785982E1f101E93b906 0.05 "Weather API credits"
```

| Result | Meaning |
|---|---|
| `"status": "paid"` | Done. Includes an explorer link. |
| `"status": "pending_approval"` | Over a limit. Not paid yet: the owner has to approve it. Note the `requestId`. |
| `"status": "error"` | Nothing was paid. `message` says why and `hint` says what to do. |

## Wait for approval

```bash title="Terminal"
aidr wait 42 --timeout 2
```

`42` is the `requestId`. It prints the result once the owner approves or rejects, or when the request expires. `aidr status 42` checks once without waiting.

## See past payments

```bash title="Terminal"
aidr history
```

## Remove the agent from this computer

```bash title="Terminal"
aidr reset --yes
```

This deletes the key. The owner should also click **Revoke** in the app.

## Special cases

| Situation | Command |
|---|---|
| The owner runs the app somewhere else (for example locally) | `aidr setup --app http://localhost:5173` |
| You already know the wallet number | `aidr setup --wallet 1` |
| Arc mainnet | `aidr setup --network mainnet --contract 0x…` |
| The owner gave you an existing key | `export AIDR_AGENT_KEY=0x…` then `aidr init --wallet 1` |

## Next

Let Claude run these commands for you: [use it with Claude](/docs/use-with-claude). Every flag is in the [CLI reference](/docs/cli-reference).
