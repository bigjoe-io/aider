---
title: Quickstart for owners
summary: Create a wallet, fund it and give your first agent a key with limits.
group: Get started
order: 2
meta: Time=About 5 minutes | You need=A browser wallet and a little testnet USDC | Network=Arc Testnet
tags: quickstart-agents, spending-rules, approval-requests
---

## Before you start

You need a browser wallet such as MetaMask and some testnet USDC. Get testnet USDC from Circle's faucet at [faucet.circle.com](https://faucet.circle.com). On Arc, gas is also paid in USDC, so the same balance covers fees.

You don't need to create a key for the agent. The agent makes its own and sends you a link.

## 1. Connect

Open the app at `/app` and click **Connect wallet**. If your wallet is on another network, the app asks you to switch to Arc Testnet.

## 2. Create a wallet

Click **Create wallet** and confirm in your wallet. You get a wallet id (1, 2, 3…).

## 3. Deposit USDC

Open **Overview** and click **Deposit**. Enter an amount, for example `5`. Your wallet asks for two confirmations:

1. **Approve** lets the Aider contract move that amount of USDC from your address.
2. **Deposit** moves it into your Aider wallet.

If you already approved enough earlier, the app skips the first step.

## 4. Add an agent

On the agent's machine, run (or ask your agent to run):

```bash title="Terminal"
aidr setup --name "Claude Code"
```

It prints a link. Open it in this browser: **Add agent** opens with the agent's address and name filled in. Choose:

| Field | Example | Meaning |
|---|---|---|
| Per payment | `$0.10` | The largest single payment it can make on its own. |
| Per day | `$0.50` | The most it can spend on its own per UTC day. |
| Expires | 30 days | After this the key stops working. "Never" is allowed. |
| Send 0.05 USDC for gas | on | Gas on Arc is paid in USDC, so the agent needs a little. |

Click **Add agent**. That's it: the agent finds your wallet by itself. It can check with `aidr balance`.

New to `aidr`? The [quickstart for agents](/docs/quickstart-agents) covers installing it.

## 5. Watch and approve

Payments within the limits appear in **Activity** with their memo and an explorer link. Anything bigger appears in **Approvals**, with the amount already reserved. Click **Approve** to pay it or **Reject** to release the money.

## Next

Read [spending rules](/docs/spending-rules) to choose good limits, and [revoking and pausing](/docs/revoking-and-pausing) for the emergency controls.
