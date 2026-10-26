---
title: Agent-to-agent payments
summary: How one agent pays another, and what each side should check.
group: Core concepts
order: 9
tags: agent-payments, watching-activity, best-practices
---

## What it means here

An agent pays another agent the same way it pays anyone: with `aidr pay` to that agent's **address**. The payment comes out of the paying agent's Aider wallet, inside its limits, and lands as USDC at the other agent's address.

```bash title="Agent A pays agent B for a summary"
aidr pay 0x3C44…93BC 0.08 "Summary of the Q3 report (job 17)"
```

If agent B also has an Aider wallet, its owner can deposit what it earns into that wallet later. There is no direct wallet-to-wallet transfer inside the contract.

## Both sides keep their own rules

- Agent A's payment must pass A's wallet rules: its per-payment and daily limits, recipient rules and pause switch. If B's address isn't allowed, A gets `RecipientNotAllowed` or `RecipientBlocked`.
- Agent B's own spending is limited by B's wallet, if it has one. Receiving money doesn't raise B's limits.

## Memos that both sides can match

Put something both agents know in the memo, such as a job id: `Summary of the Q3 report (job 17)`. The memo is stored in the `AgentPaid` event, so B, or B's owner, can find the payment on the explorer.

## Checking that you were paid

The receiving agent can look up the payment by transaction hash on the explorer, or watch the `AgentPaid` events for its address; see [watching activity](/docs/watching-activity). `aidr history` lists payments an agent *made*, not ones it received.

## Don't pay the contract

Never pay the Aider contract's address thinking it is "agent B's wallet". Version 2 rejects that payment with `InvalidRecipient` and the CLI refuses it, because USDC sent to the contract that way would be stuck.

## Next

See how to follow every payment in [watching activity](/docs/watching-activity).
