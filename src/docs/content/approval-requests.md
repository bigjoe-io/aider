---
title: Approval requests
summary: How payments over an agent's limits wait for the owner, with the money reserved.
group: Core concepts
order: 6
meta: Functions=requestPayment, approveRequest, rejectRequest, expireRequest | Time to decide=Up to 7 days (CLI default 30 minutes) | Reserves funds=Yes
tags: agent-payments, revoking-and-pausing, cli-reference
---

## When a request is created

An agent calls `requestPayment(walletId, to, amount, memo, ttlSeconds)` when it needs to pay more than its limits allow. The CLI does this for you when `aidr pay` hits the per-payment or the daily limit, with a default TTL (time to decide) of 30 minutes; `--ttl` changes it.

The same checks as a payment apply first: the agent must be active and unexpired, the wallet unpaused, and the recipient valid and allowed. Then:

- the amount moves from **available** to **reserved**, so nothing else can spend it;
- the request gets an id and the event `PaymentRequested(requestId, walletId, agent, to, amount, memo, expiresAt)`;
- it shows up in the owner's **Approvals** inbox.

In version 2 the TTL must be between 1 second and 7 days (`InvalidTTL` otherwise), and an agent can have at most 10 open requests per wallet (`TooManyOpenRequests`).

## Approve

Only the wallet's owner can approve, and only while:

- the TTL hasn't passed (`RequestExpiredError` after it);
- the agent that made the request is still active and unexpired (v2: `AgentRevokedError` or `AgentExpired`);
- the recipient is still allowed by the current rules (`RecipientBlocked`, `RecipientNotAllowed`).

Approving pays the recipient from the reserved money and emits `RequestApproved`. Approved payments **don't count** toward the agent's daily limit. Approvals still work while the wallet is paused, because pausing only stops agents.

## Reject

The owner can reject a pending request at any time. The reserved amount goes back to available and `RequestRejected` is emitted. Version 2 adds `rejectRequests(ids)` to reject many in one transaction, for example after revoking an agent.

## Expire and release

A request whose TTL has passed can't be approved, but its money stays reserved until someone calls `expireRequest(id)`. Anyone can call it. It releases the reservation and emits `RequestExpired`. Version 2 also lets anyone release a request at once if the agent that made it was revoked or has expired, and adds `expireRequests(ids)` for many at once.

## Statuses

| Status | Meaning |
|---|---|
| Pending | Waiting for the owner. Money reserved. |
| Approved | Paid. |
| Rejected | The owner said no. Money released. |
| Expired | Released after its TTL, or voided because its agent was revoked or expired. |

A request can still be stored as pending after its TTL passed, if nobody has released it yet. The app shows it under "Expired" with a **Release** button, and `aidr status` reports it as `expired`.

## From the agent's side

```bash title="Terminal"
aidr status 42                 # pending, approved, rejected or expired
aidr wait 42 --timeout 1.5     # polls every 5 seconds until it's decided
```

## Next

See all the [spending rules](/docs/spending-rules) that decide when a request is needed.
