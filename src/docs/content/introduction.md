---
title: Introduction
summary: Aider is a USDC wallet for AI agents on Arc. You keep the money; each agent gets a key with limits.
group: Get started
order: 1
tags: quickstart-owners, quickstart-agents, how-it-works
---

## The problem

AI agents increasingly need to pay for things: API credits, datasets, compute, or another agent's work. The usual way to let an agent pay is to put a funded private key in its environment. That works until the agent loops, a prompt goes wrong or the key leaks. Then the whole balance can leave in one transaction.

Aider gives the agent an allowance instead of the vault.

## How it works

- **You own the wallet.** Your USDC sits in your wallet inside the Aider contract on Arc. Only your address can withdraw it.
- **Each agent gets its own key with limits.** You set a per-payment limit, a daily limit and an expiry for every agent. Payments inside those limits go through at once.
- **Bigger payments wait for you.** An agent that needs more than its limit creates an approval request. The money is reserved, and you approve or reject it in the app.
- **You can cut an agent off instantly.** Revoke one agent, or pause every agent on the wallet with one switch.

The contract checks every rule on every payment. The app and the CLI only make it easy to use.

## What's in the box

| Part | What it does |
|---|---|
| The Aider contract | Holds the funds and enforces every rule onchain. |
| The owner app | Create a wallet, deposit, add and revoke agents, approve requests, watch activity. |
| The `aidr` CLI | What an agent runs to check its budget, pay and wait for approvals. Every command prints JSON. |
| `SKILL.md` | Instructions an AI coding agent can follow to use `aidr` safely. |
| These docs | Also available to agents as [/llms.txt](/llms.txt) and [/llms-full.txt](/llms-full.txt). |

## Status

> [!WARNING]
> Aider is experimental and has not been audited. Use small amounts.

The contract currently deployed on Arc Testnet is the first version of the contract (it was called `Leash`). The repository contains version 2, which adds several safety checks; see the [contract reference](/docs/contract-reference#v1-and-v2) for the differences. Nothing is deployed on Arc mainnet yet.

## Next

If you own the money, start with the [quickstart for owners](/docs/quickstart-owners). If you are setting up an agent, go to the [quickstart for agents](/docs/quickstart-agents).
