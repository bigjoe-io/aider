---
title: Revoking and pausing
summary: The two emergency controls, what each one stops, and how to undo them.
group: Core concepts
order: 8
meta: Functions=revokeAgent, pauseWallet | Caller=The wallet owner | Takes effect=Immediately
tags: approval-requests, security-model, spending-rules
---

## Revoke or pause?

| | Revoke an agent | Pause the wallet |
|---|---|---|
| Stops | One agent | Every agent of the wallet |
| Its direct payments | Rejected (`AgentRevokedError`) | Rejected (`WalletPaused`) |
| Its new requests | Rejected | Rejected |
| Its open requests | Voided in v2: can't be approved, anyone can release them | Still there; you can approve or reject them |
| Owner actions | All still work | All still work, including withdraw and approve |
| Undo | Re-add the agent | Resume |

Use **revoke** when one agent misbehaves or its key may have leaked. Use **pause** when you want everything to stop while you look.

## Revoke

In the app, open **Agents** and click **Revoke** on the agent. The contract call is `revokeAgent(walletId, agent)`. From the next block the agent can't pay or create requests.

In version 2, revoking also voids the agent's open requests. They can never be approved, even if you add the agent again later, and anyone can release their reserved money with `expireRequest`. The app shows them with a **Release** button. On version 1, those requests stay approvable, so the app only offers **Reject** for requests from revoked agents.

## Re-enable

Click **Re-enable** on a revoked agent. This calls `addAgent` again with the same label and limits. In version 2 the agent keeps what it already spent today, so re-enabling doesn't reset its daily limit.

## Pause

On **Overview**, click **Pause all agents**. The call is `pauseWallet(walletId, true)`. Every agent's payments and requests are rejected with `WalletPaused` until you click **Resume**. You can still deposit, withdraw, change rules and decide on requests while paused.

## Expiry

An agent whose expiry has passed behaves like a revoked one (`AgentExpired`) until you extend it with **Edit limits**. In version 2 its open requests can't be approved and can be released by anyone.

## Next

See the full picture in the [security model](/docs/security-model).
