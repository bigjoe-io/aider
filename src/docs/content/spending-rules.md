---
title: Spending rules
summary: Every rule an owner can set, what it does and where to change it.
group: Core concepts
order: 7
tags: agent-payments, revoking-and-pausing, best-practices
---

## Per agent

| Rule | Type | Example | What it does | Change it with |
|---|---|---|---|---|
| Per-payment limit | USDC | `$0.10` | The largest single payment the agent can make on its own. | Agents → Edit limits (`updateAgent`) |
| Daily limit | USDC | `$0.50` | The most the agent can spend on its own per UTC day. | Agents → Edit limits (`updateAgent`) |
| Expiry | date or never | 30 days | After this the key stops working. | Agents → Edit limits (`updateAgent`) |
| Label | text | `Claude Code` | A name for Activity and approval cards. | Re-add the agent (`addAgent`) |

Version 2 rejects an expiry that is already in the past (`InvalidExpiry`); "never" is stored as `0`.

Anything over the per-payment or daily limit can still happen, but only as an [approval request](/docs/approval-requests) you approve.

## Per wallet

| Rule | Values | What it does | Change it with |
|---|---|---|---|
| Recipient mode | Anyone / Allowlist only | Who agents may pay. | Rules (`setRecipientMode`) |
| Allowlist | addresses | In allowlist mode, the only recipients allowed. | Rules (`setAllowlist`) |
| Blocklist | addresses | Recipients that can never be paid, in any mode. | Rules (`setBlocklist`) |
| Paused | on / off | Stops every agent of the wallet. | Overview (`pauseWallet`) |

A blocked address always loses: it can't be paid even if it's also on the allowlist. Recipient rules apply to payments, to new requests, and again when you approve a request.

## Built in

| Rule | Value |
|---|---|
| Longest request TTL | 7 days (v2) |
| Open requests per agent per wallet | 10 (v2) |
| Recipients that are always refused | The Aider contract and the USDC token (v2) |

## The daily limit and UTC days

The spent-today counter resets at 00:00 UTC, not 24 hours after the first payment. Re-adding an agent the same day keeps what it already spent (v2), so re-enabling a revoked agent doesn't give it a fresh allowance. Because the reset is at midnight UTC, a key can spend up to twice its daily limit in a short window around midnight. Size the daily limit with that in mind.

## Next

Learn the emergency controls in [revoking and pausing](/docs/revoking-and-pausing).
