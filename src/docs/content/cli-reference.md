---
title: CLI reference
summary: Every aidr command, flag and JSON result.
group: Reference
order: 14
meta: Binary=aidr | Package=aidr-cli (cli/ in the repo) | Output=One JSON object on stdout | Exit codes=0 success, 1 error
tags: quickstart-agents, skill-md, errors
---

## Conventions

- Every command prints exactly one JSON object on stdout and a short human line on stderr.
- Exit code `0` means success, `1` means an error. Errors look like `{ "status": "error", "error", "message", "hint" }`.
- Amounts in JSON are USDC decimal strings such as `"0.05"`.
- Config lives in `~/.aidr/config.json` and the key in `~/.aidr/key`.

## aidr init

Saves the wallet, network and agent key on this machine.

```bash title="Terminal"
export AIDR_AGENT_KEY=0x…
aidr init --wallet 1
```

| Flag | Default | Meaning |
|---|---|---|
| `--wallet <id>` | required | The Aider wallet id. |
| `--key <hex>` | `AIDR_AGENT_KEY` | The agent's private key. Prefer the env var. |
| `--network testnet|mainnet` | `testnet` | Which Arc network. `--mainnet` is a shortcut. |
| `--contract <address>` | testnet deployment | Required on mainnet. |
| `--rpc <url>` | Arc's public RPC | Use another RPC. |
| `--deploy-block <n>` | testnet: 69187895 | Where `history` stops scanning. |

It checks the RPC's chain, that the address holds an Aider contract, that the key isn't the wallet owner's, and warns if the key isn't an active agent yet.

## aidr balance

Shows the wallet's balance, reserved and available amounts, whether it's paused, the recipient mode, and this agent's status, limits, `spentToday`, `remainingToday`, `dailyResetAt` and `expiresAt`. `maxDirectPayment` is the largest payment that goes through right now without approval. `agent.status` is `active`, `revoked`, `expired` or `not_added`.

## aidr pay

```bash title="Terminal"
aidr pay <to> <amount> "<memo>" [--no-request] [--ttl <minutes>] [--send-anyway]
```

| Flag | Default | Meaning |
|---|---|---|
| `--no-request` | off | Fail with the limit error instead of creating an approval request. |
| `--ttl <minutes>` | 30 | How long the owner has to approve a request: 1 to 10080. |
| `--send-anyway` | off | Broadcast even if the contract will reject it, to record the rejection onchain. Costs gas; never creates a request. |

| `status` | Meaning | Exit |
|---|---|---|
| `paid` | Paid. Includes `txHash`, `explorer`, `blockNumber`. | 0 |
| `pending_approval` | Over a limit; request created. Includes `requestId`, `reason`, `expiresAt`, `ttlMinutes`. | 0 |
| `error` | Nothing was paid. | 1 |
| `rejected_onchain` | Mined but rejected by the contract; only gas was spent. | 1 |

## aidr status

```bash title="Terminal"
aidr status <requestId>
```

`status` is `pending`, `approved`, `rejected` or `expired`. For expired requests, `expiredBecause` is `ttl` or `voided` (v2: the agent was revoked or expired), and `amountReserved` tells you whether the money is still set aside until someone releases it. Other fields: `onchainStatus`, `approvable`, `walletId`, `agent`, `mine`, `to`, `amount`, `memo`, `expiresAt`, `secondsLeft`, `note`.

## aidr wait

```bash title="Terminal"
aidr wait <requestId> [--timeout <minutes>]
```

Checks every 5 seconds and prints the same JSON as `status` once the request is approved, rejected or expired (exit 0). With `--timeout` it stops earlier with the error `Timeout` (exit 1). Decimals are allowed, for example `--timeout 1.5`.

## aidr history

```bash title="Terminal"
aidr history [--limit <n>] [--blocks <n>]
```

This agent's recent direct payments, newest first, with `time`, `to`, `amount`, `memo`, `txHash`, `explorer` and `blockNumber`. Defaults: 20 payments, scanning back up to 500,000 blocks and never below the deploy block. `olderMayExist: true` means there may be more. Approved requests aren't listed; check them with `aidr status`.

## Next

Give the rules to your agent with [SKILL.md](/docs/skill-md).
