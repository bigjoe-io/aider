---
title: Errors
summary: Every contract and CLI error, when it happens and what to do.
group: Security
order: 12
tags: agent-payments, cli-reference, approval-requests
---

## Contract errors

These come from the Aider contract. The CLI shows them in `error` and the app shows a plain-English message. Errors marked v2 exist only in version 2 of the contract.

| Error | When | What to do |
|---|---|---|
| `NotWalletOwner` | Someone other than the owner called an owner function | Use the owner's wallet. |
| `WalletPaused` | An agent paid or requested while the wallet is paused | Agent: stop and tell the user. Owner: resume when ready. |
| `AgentNotActive` | The key was never added as an agent of this wallet | Owner: add the agent's address. |
| `AgentRevokedError` | The agent was revoked (also when approving a voided request in v2) | Agent: stop. Owner: re-enable only if you trust it. |
| `AgentExpired` | The agent's expiry passed | Owner: extend it with Edit limits. |
| `ZeroAddress` | The recipient or agent address is `0x0…0` | Use a real address. |
| `InvalidRecipient` (v2) | The recipient is the Aider contract or the USDC token | Pay the recipient's own address. |
| `ZeroAmount` | The amount is 0 | Use a positive amount. |
| `RecipientBlocked` | The recipient is on the blocklist | Don't pay it. |
| `RecipientNotAllowed` | Allowlist mode and the recipient isn't on it | Owner: allowlist it, if you want to. |
| `OverPerPaymentLimit` | The amount is over the per-payment limit | The CLI turns this into an approval request. |
| `OverDailyLimit` | Today's spending would go over the daily limit | The CLI turns this into an approval request. |
| `InsufficientBalance` | The wallet's available balance is too low | Owner: deposit. No request is created. |
| `InvalidTTL` | A request's TTL is 0 (or over 7 days in v2) | Use 1 minute to 7 days. |
| `TooManyOpenRequests` (v2) | The agent already has 10 open requests on this wallet | Owner: decide on some first. |
| `RequestNotFound` (v2) | No request with that id | Use the id from `aidr pay`. |
| `RequestNotPending` | The request was already approved, rejected or released | Nothing to do. |
| `RequestExpiredError` | Approving after the request's TTL | Release it; the agent can ask again. |
| `RequestNotExpiredYet` | Releasing a request that can still be approved | Wait for the TTL, or reject it as the owner. |
| `OwnerCannotBeAgent` (v2) | Adding the owner's own address as an agent | Use a separate key for the agent. |
| `InvalidExpiry` (v2) | An expiry date already in the past | Pick a future date, or "never". |
| `WALLET_NOT_FOUND` | The wallet id doesn't exist | Check the id. |
| `USDC_TRANSFER_FAILED`, `USDC_TRANSFER_FROM_FAILED` | The USDC token refused a transfer | Check balances and the USDC approval. |

## CLI errors

These come from `aidr` itself; nothing reached the contract.

| Error | When | What to do |
|---|---|---|
| `InvalidAmount` | The amount isn't a positive number with at most 6 decimals | Use `0.05`, `1` or `'$0.05'`. |
| `MemoRequired`, `MemoTooLong` | No memo, or more than 256 bytes | Write a short, honest memo. |
| `InvalidAddress` | The recipient isn't a valid address | Check it. |
| `UsageError` | Wrong arguments, for example an unquoted memo | Quote the memo. |
| `Timeout` | `aidr wait --timeout` ran out | Wait again later; don't create a duplicate request. |
| `InsufficientGasFunds` | The agent's address has no USDC for gas | Send it a little USDC. |
| `NonceConflict` | Two transactions from the same key at once | Run one payment at a time. |
| `RpcError`, `ReceiptTimeout` | Network trouble, or no confirmation in time | Check the explorer link or `aidr history` before retrying. |
| `NotConfigured`, `KeyMissing`, `KeyMismatch`, `ConfigInvalid` | `aidr` isn't set up on this machine | Run `aidr init` again. |

## Next

Avoid most of these with the [best practices](/docs/best-practices).
