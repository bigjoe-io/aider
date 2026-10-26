---
title: Agent payments
summary: What happens when an agent pays, check by check, and what each failure means.
group: Core concepts
order: 5
meta: Function=agentPay(walletId, to, amount, memo) | Caller=An active agent of the wallet | Moves funds=Yes, immediately | Event=AgentPaid
tags: approval-requests, spending-rules, errors
---

## The call

An agent pays by calling `agentPay(walletId, to, amount, memo)` with its own key. With the CLI that's `aidr pay <to> <amount> "<memo>"`. Amounts use USDC's 6 decimals, so `0.05` USDC is `50000`.

## The checks, in order

The contract runs these checks one after another and stops at the first that fails. Nothing moves unless every check passes.

| # | Check | Error if it fails |
|---|---|---|
| 1 | The wallet exists | `WALLET_NOT_FOUND` |
| 2 | The caller was added as an agent of this wallet | `AgentNotActive` |
| 3 | The agent hasn't been revoked | `AgentRevokedError` |
| 4 | The agent's expiry hasn't passed | `AgentExpired` |
| 5 | The wallet isn't paused | `WalletPaused` |
| 6 | The recipient isn't the zero address | `ZeroAddress` |
| 7 | The recipient isn't the Aider contract or the USDC token (v2) | `InvalidRecipient` |
| 8 | The amount is more than zero | `ZeroAmount` |
| 9 | The recipient isn't on the blocklist | `RecipientBlocked` |
| 10 | In allowlist mode, the recipient is on the allowlist | `RecipientNotAllowed` |
| 11 | The amount is at most the per-payment limit | `OverPerPaymentLimit` |
| 12 | Spent today plus the amount is at most the daily limit | `OverDailyLimit` |
| 13 | The wallet's available balance covers it | `InsufficientBalance` |

Before check 12 the contract resets the agent's counter if a new UTC day has started.

## When every check passes

1. The amount is added to the agent's spent-today counter.
2. The wallet's balance goes down by the amount.
3. The contract sends the USDC to the recipient.
4. It emits `AgentPaid(walletId, agent, to, amount, memo)`.

The payment is final as soon as the transaction confirms.

## When a limit is in the way

If check 11 or 12 fails, `aidr pay` doesn't give up: it creates an [approval request](/docs/approval-requests) for the same payment, so the owner can decide. Use `--no-request` to get the error instead.

Every other failure is returned as an error and no request is created. In particular `InsufficientBalance` never turns into a request, because a request would need the same available balance.

## Memos

Every payment carries a memo. The owner sees it in Activity and on approval cards, so write what the payment is actually for: `API credits for the weather lookup`, not `payment`. The CLI requires a memo and limits it to 256 bytes.

## Never pay the contract itself

Version 2 of the contract rejects payments to the Aider contract's own address or to the USDC token with `InvalidRecipient`, and the CLI refuses them too. USDC sent to either would be stuck. To pay another agent, pay that agent's own address; see [agent-to-agent payments](/docs/agent-to-agent).

## Next

See what happens to over-limit payments in [approval requests](/docs/approval-requests).
