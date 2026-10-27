---
title: Introduction
summary: Aider is a USDC wallet for AI agents on Arc. You keep the money; each agent gets an allowance.
group: Get started
order: 1
tags: quickstart, quickstart-owners, quickstart-agents
---

## What Aider does

Aider lets an AI agent, such as Claude Code, pay for things with USDC **without holding your money**.

- **You keep the money.** Your USDC sits in your Aider wallet on Arc. Only you can withdraw it.
- **Each agent gets an allowance.** You choose how much it can pay at once and per day. Payments inside that go through by themselves.
- **Bigger payments wait for you.** The agent asks, and you approve or reject it in the app.
- **You can stop an agent at any time.** One click revokes it.

## How you set it up

1. **In the app:** connect your wallet, create an Aider wallet and add some USDC.
2. **On the agent's computer:** install `aidr` and run `aidr setup`. It prints a link.
3. **Open the link:** choose the agent's limits and click **Add agent**.

That's all. The agent can now pay. Follow the [quickstart](/docs/quickstart) for the exact steps.

## The parts

| Part | Where | What it's for |
|---|---|---|
| The app | [aider-smoky.vercel.app/app](https://aider-smoky.vercel.app/app) | You: add money, add agents, approve, revoke. |
| `aidr` | The agent's computer (`npm install -g aidr-cli`) | The agent: check its budget, pay, wait for approval. |
| `SKILL.md` | [/skill.md](/skill.md) | Instructions that teach an AI agent to use `aidr` safely. |
| The Aider contract | Arc | Holds the money and checks every rule. |

## Status

> [!WARNING]
> Aider is experimental and unaudited, and runs on **Arc Testnet**: the USDC is free test money. Use small amounts.

## Next

Start with the [quickstart](/docs/quickstart).
