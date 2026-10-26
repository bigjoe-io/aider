---
title: Contract reference
summary: Addresses, constants, every function, view and event of the Aider contract.
group: Reference
order: 16
meta: Source=contracts/Aider.sol | Solidity=0.8.28 | USDC=0x3600…0000 (ERC-20, 6 decimals) | Upgradeable=No
tags: watching-activity, errors, security-model
---

## Addresses

| Network | Address | Notes |
|---|---|---|
| Arc Testnet (5042002) | [0xed32e15d81e7864bf19caea4333bd0781f328ba3](https://explorer.testnet.arc.io/address/0xed32e15d81e7864bf19caea4333bd0781f328ba3) | Version 1 (deployed as `Leash`), deploy block 69187895 |
| Arc mainnet (5042) | Not deployed yet | |

## Constants

| Name | Value |
|---|---|
| `USDC_TOKEN` | `0x3600000000000000000000000000000000000000` |
| `MAX_REQUEST_TTL` (v2) | 7 days |
| `MAX_OPEN_REQUESTS_PER_AGENT` (v2) | 10 |

## Owner functions

| Function | What it does | Can revert with |
|---|---|---|
| `createWallet() → walletId` | Creates a wallet owned by the caller (anyone can call it). | — |
| `deposit(walletId, amount)` | Pulls USDC from the owner into the wallet. Approve the contract on USDC first. | `NotWalletOwner`, `ZeroAmount` |
| `withdraw(walletId, amount)` | Sends available USDC to the owner. Works while paused. | `NotWalletOwner`, `ZeroAmount`, `InsufficientBalance` |
| `pauseWallet(walletId, paused)` | Stops or resumes every agent. | `NotWalletOwner` |
| `addAgent(walletId, agent, label, perPaymentLimit, dailyLimit, expiresAt)` | Adds, re-enables or relabels an agent; keeps today's spend in v2. `expiresAt` 0 = never. | `NotWalletOwner`, `ZeroAddress`, `OwnerCannotBeAgent` (v2), `InvalidExpiry` (v2) |
| `updateAgent(walletId, agent, perPaymentLimit, dailyLimit, expiresAt)` | Changes limits and expiry. Doesn't re-enable. | `NotWalletOwner`, `ZeroAddress`, `AgentNotActive`, `InvalidExpiry` (v2) |
| `revokeAgent(walletId, agent)` | Revokes at once; voids its open requests in v2. | `NotWalletOwner`, `ZeroAddress`, `AgentNotActive` (v2) |
| `setRecipientMode(walletId, mode)` | `0` anyone, `1` allowlist only. | `NotWalletOwner` |
| `setAllowlist(walletId, recipient, allowed)` | Edits the allowlist. | `NotWalletOwner` |
| `setBlocklist(walletId, recipient, blocked)` | Edits the blocklist. | `NotWalletOwner` |
| `approveRequest(requestId)` | Pays a pending request. | `RequestNotFound` (v2), `RequestNotPending`, `NotWalletOwner`, `RequestExpiredError`, `AgentRevokedError` (v2), `AgentExpired` (v2), `RecipientBlocked`, `RecipientNotAllowed` |
| `rejectRequest(requestId)` | Rejects and releases a pending request. | `RequestNotFound` (v2), `RequestNotPending`, `NotWalletOwner` |
| `rejectRequests(requestIds) → count` (v2) | Rejects many; skips ones that aren't pending. | `RequestNotFound`, `NotWalletOwner` |

## Agent functions

| Function | What it does | Can revert with |
|---|---|---|
| `agentPay(walletId, to, amount, memo)` | Pays within the limits. See [agent payments](/docs/agent-payments) for the order of checks. | `AgentNotActive`, `AgentRevokedError`, `AgentExpired`, `WalletPaused`, `ZeroAddress`, `InvalidRecipient` (v2), `ZeroAmount`, `RecipientBlocked`, `RecipientNotAllowed`, `OverPerPaymentLimit`, `OverDailyLimit`, `InsufficientBalance` |
| `requestPayment(walletId, to, amount, memo, ttlSeconds) → requestId` | Reserves the amount and asks the owner. | the agent and recipient checks above, `InvalidTTL`, `TooManyOpenRequests` (v2), `InsufficientBalance` |

## Anyone

| Function | What it does | Can revert with |
|---|---|---|
| `expireRequest(requestId)` | Releases a request after its TTL, or at once if its agent was revoked or expired (v2). | `RequestNotFound` (v2), `RequestNotPending`, `RequestNotExpiredYet` |
| `expireRequests(requestIds) → count` (v2) | Releases many; skips ones that can't be released yet. | `RequestNotFound` |

## Views

| View | Returns |
|---|---|
| `getWallet(walletId)` | `owner, balance, reserved, available, paused, mode` |
| `getAgent(walletId, agent)` | `label, perPaymentLimit, dailyLimit, expiresAt, active, spentToday, dayStart` (v2 resets `spentToday` to 0 after a UTC rollover; v1 returns the stored value) |
| `getRequest(requestId)` | `walletId, agent, to, amount, memo, expiresAt, status` (0 pending, 1 approved, 2 rejected, 3 expired; unknown ids have `agent` = 0x0) |
| `getRequestState(requestId)` (v2) | `status, approvable, releasable` |
| `getPendingRequests(walletId)` | Ids stored as pending, including ones past their TTL that nobody released. Order not guaranteed. |
| `openRequestCount(walletId, agent)` (v2) | How many requests the agent has open |
| `nextWalletId()`, `nextRequestId()` | The next ids to be used |
| `isAllowlisted`, `isBlocklisted`, `isRecipientPermitted` | Recipient checks for a wallet |

Events are listed in [watching activity](/docs/watching-activity).

## v1 and v2

Version 2 keeps every v1 function, event and error unchanged and adds:

| Change | v1 (deployed on testnet) | v2 (in the repo) |
|---|---|---|
| Paying the contract or the USDC token | Allowed; the USDC gets stuck | `InvalidRecipient` |
| Re-adding an agent the same day | Resets today's spend | Keeps today's spend |
| Requests of a revoked or expired agent | Still approvable | Voided; anyone can release them |
| Request TTL | Any length | Up to 7 days |
| Open requests per agent | Unlimited | 10 |
| Owner as agent, past expiry | Allowed | `OwnerCannotBeAgent`, `InvalidExpiry` |
| Unknown request ids | Look pending | `RequestNotFound` |
| `getAgent().spentToday` after midnight | Stale | 0 |
| Batch reject/release, `getRequestState` | — | Added |

## Next

Look up terms in the [glossary](/docs/glossary).
