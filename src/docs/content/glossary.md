---
title: Glossary
summary: The words these docs use, in one place.
group: Reference
order: 17
tags: introduction, how-it-works
---

## Terms

| Term | Meaning |
|---|---|
| Owner | The address that created an Aider wallet. The only one who can withdraw or change its rules. |
| Wallet | A balance and a set of rules inside the Aider contract, identified by a number. |
| Agent | An address the owner allowed to spend from the wallet within limits. |
| Agent key | The private key of an agent's address, stored on the agent's machine. |
| Label | A name the owner gives an agent, such as `Claude Code`. |
| Per-payment limit | The largest single payment an agent can make on its own. |
| Daily limit | The most an agent can spend on its own per UTC day. |
| UTC day | The 24 hours from 00:00 to 24:00 UTC. Daily limits reset at 00:00 UTC. |
| Spent today | What an agent has spent on its own in the current UTC day. |
| Expiry | The time after which an agent's key stops working. "Never" is allowed. |
| Recipient mode | Whether agents can pay anyone or only allowlisted addresses. |
| Allowlist | The addresses agents may pay in allowlist mode. |
| Blocklist | Addresses agents can never pay. |
| Pause | Stops every agent of a wallet until the owner resumes it. |
| Revoke | Stops one agent immediately. |
| Approval request | A payment an agent asked for because it was over a limit. Waits for the owner. |
| Reservation | Money set aside for an open request so it can't be spent twice. |
| TTL | How long the owner has to approve a request. |
| Release | Freeing a request's reservation after it can no longer be approved (`expireRequest`). |
| Voided request | (v2) A request whose agent was revoked or expired. It can't be approved and anyone can release it. |
| Memo | The reason an agent gives for a payment. Stored onchain. |
| Available | Balance minus reserved: what agents can spend and the owner can withdraw. |
| USDC | Circle's dollar stablecoin. On Arc it's used through an ERC-20 interface with 6 decimals and also pays for gas. |
| Arc | Circle's blockchain for stablecoin payments. |
| `aidr` | The command-line tool agents use. |
| SKILL.md | The instruction file for AI agents that use `aidr`. |
