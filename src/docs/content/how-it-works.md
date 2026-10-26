---
title: How it works
summary: The pieces, where the money lives, and what happens to every payment.
group: Get started
order: 4
tags: agent-payments, approval-requests, security-model
---

## The pieces

| Piece | Who uses it | Holds |
|---|---|---|
| Owner | You, with a normal browser wallet | Full control of your Aider wallet |
| Aider wallet | Lives inside the Aider contract | A USDC balance, a reserved amount, rules and agents |
| Agent | An AI agent with its own key | Permission to spend within its limits |
| Aider contract | Everyone, onchain on Arc | All wallets' USDC and every rule |
| `aidr` | The agent's machine | The agent key, in `~/.aidr/` |

## Where the money lives

All USDC sits in the Aider contract. Each wallet has its own ledger inside it:

- **balance**: the USDC this wallet holds;
- **reserved**: the part set aside for open approval requests;
- **available**: balance minus reserved, which is what agents can spend and what you can withdraw.

Only the wallet's owner can withdraw. There is no admin key and no upgrade path, so nobody else can move the money out.

## The life of a payment

```text title="aidr pay"
agent runs: aidr pay <to> <amount> "<memo>"
        │
        ▼
contract checks, in order: key active? not expired? wallet not paused?
                           valid recipient? not blocked? allowed?
                           ≤ per-payment limit? ≤ what's left today? enough available?
        │
        ├── all pass ──────────────► PAID: USDC goes to <to>, AgentPaid event
        │
        ├── over a limit ──────────► aidr creates an APPROVAL REQUEST:
        │                            amount reserved, owner approves or rejects
        │
        └── anything else ─────────► BLOCKED: nothing moves, the error says why
```

## Days are UTC days

Each agent's spending counter resets at 00:00 UTC. A key could therefore spend its daily limit just before midnight and again just after, so the most it can spend inside a short window is up to twice the daily limit. After you revoke it, it can spend nothing.

## What's onchain and what isn't

Every deposit, payment, request, approval, rejection and rule change is an Arc transaction with an event, so anyone can check it on the explorer. The owner app reads those events to show Activity; it doesn't store anything itself. The CLI keeps only its config and key on the agent's machine.

## Next

Go through [agent payments](/docs/agent-payments) check by check, then [approval requests](/docs/approval-requests).
