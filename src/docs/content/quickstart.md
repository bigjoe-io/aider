---
title: Quickstart
summary: Your first agent payment in 5 steps, about 10 minutes.
group: Get started
order: 2
meta: Time=About 10 minutes | You need=MetaMask (or another browser wallet) and Node 18+ | Network=Arc Testnet
tags: quickstart-owners, quickstart-agents, use-with-claude
---

## Step 1: Get test USDC

1. Install a browser wallet such as MetaMask if you don't have one.
2. Get free test USDC from [faucet.circle.com](https://faucet.circle.com). Choose **Arc Testnet** and paste your wallet address.

On Arc, fees are also paid in USDC, so this one balance covers everything.

## Step 2: Create your Aider wallet

1. Open [the app](https://aider-smoky.vercel.app/app) and click **Connect wallet**. If asked, switch to Arc Testnet.
2. Click **Create wallet** and confirm.
3. Click **Deposit**, enter `5` and confirm the two prompts (**Approve**, then **Deposit**).

## Step 3: Install aidr on the agent's computer

The agent's computer is wherever the agent runs, for example your laptop if you use Claude Code. Open a terminal and run:

```bash title="Terminal"
npm install -g aidr-cli
aidr --version
```

`aidr --version` should print a version number. If it says `command not found`, close the terminal, open a new one and try again.

## Step 4: Connect the agent

In the same terminal:

```bash title="Terminal"
aidr setup --name "Claude Code"
```

It prints a link like this:

```text title="Output"
Open this link where your Aider wallet is, set the limits and click Add agent:

  https://aider-smoky.vercel.app/connect?agent=0x7D47…bebf&name=Claude+Code&…
```

Open the link in the browser where your wallet is connected. The **Add agent** form is already filled in:

1. Choose the limits, for example **$0.10 per payment** and **$0.50 per day**.
2. Leave **Send 0.05 USDC for gas** on. The agent needs a little USDC to send payments.
3. Click **Add agent** and confirm the two prompts.

Check it worked:

```bash title="Terminal"
aidr balance
```

Look for `"status": "active"`.

## Step 5: Make a payment

```bash title="Terminal"
aidr pay 0x90F79bf6EB2c4f870365E785982E1f101E93b906 0.05 "My first agent payment"
```

You get `"status": "paid"` and an explorer link. The payment also appears in the app under **Activity**.

Try one over the limit:

```bash title="Terminal"
aidr pay 0x90F79bf6EB2c4f870365E785982E1f101E93b906 1 "Bigger purchase"
```

You get `"status": "pending_approval"`. Open **Approvals** in the app and click **Approve**.

> [!TIP]
> You don't have to type these yourself. Start Claude Code and ask it to pay; see [use it with Claude](/docs/use-with-claude).

## Next

- [Use it with Claude](/docs/use-with-claude): what to say, and what agents can pay for.
- [Owner guide](/docs/quickstart-owners): approvals, revoking, pausing and withdrawing.
- [Agent guide](/docs/quickstart-agents): every `aidr` command in plain steps.
