---
title: Owner guide
summary: Everything you do in the app, as short steps.
group: Get started
order: 3
meta: Where=The Aider app | You need=A browser wallet with USDC | Network={{chain}}
tags: quickstart, spending-rules, approval-requests
---

Open [the app](https://aider-smoky.vercel.app/app), check the switch in the top bar says **{{network}}**, and connect your wallet. Everything below happens there.

:::mainnet-undeployed
> [!WARNING]
> Aider isn't deployed on Arc mainnet yet, so these steps don't work on mainnet today. Switch to **Testnet** in the top bar to try everything with free test USDC.
:::

## Add money

1. Go to **Overview** and click **Deposit**.
2. Enter an amount and confirm **Approve**, then **Deposit**. If you approved enough before, there's only one prompt.

## Add an agent

1. On the agent's computer, run `aidr setup --name "Claude Code"{{setupFlags}}` (see the [agent guide](/docs/quickstart-agents)).
2. Open the link it prints. **Add agent** opens with the agent's address and name filled in.
3. Choose its limits:

| Setting | Example | What it means |
|---|---|---|
| Per payment | `$0.10` | The biggest payment it can make without asking you. |
| Per day | `$0.50` | The most it can spend without asking you, per day (resets at 00:00 UTC). |
| Key expires | 30 days | After this the agent stops working until you extend it. |
| Send 0.05 USDC for gas | On | Sends the agent a little USDC for fees. |

4. Click **Add agent** and confirm.

You never handle the agent's key. It stays on the agent's computer.

> [!NOTE]
> No link? Click **Add agent** on the **Agents** page. It shows the `aidr setup` command to run, or you can paste an address.

## Approve or reject a payment

When an agent asks for more than its limit, the money is set aside and the request appears in **Approvals**.

- Click **Approve** to pay it.
- Click **Reject** to say no. The money goes back to your available balance.

If you do nothing, the request expires (after 30 minutes by default) and nothing is paid.

## Change limits

On **Agents**, click **Edit limits**. New limits apply to the next payment.

## Stop an agent

- **One agent:** on **Agents**, click **Revoke**. It can't pay from the next block, and its open requests are cancelled.
- **All agents at once:** on **Overview**, click **Pause all agents**. Click **Resume agents** to undo it.

## Send an agent more gas

On **Agents**, click **Connect this agent**, then **Send 0.05 USDC for gas**.

## See what happened

**Activity** lists every deposit, payment, request and change, with the memo the agent wrote and an explorer link.

## Take your money out

On **Overview**, click **Withdraw**. Only you can do this.

## Next

Choose good limits with [spending rules](/docs/spending-rules), or see the [emergency controls](/docs/revoking-and-pausing) in detail.
