---
title: Security model
summary: Who can do what, what a leaked agent key can and can't do, and where keys live.
group: Security
order: 11
tags: revoking-and-pausing, best-practices, errors
---

> [!WARNING]
> Aider is experimental and has not been audited. Use small amounts.

## Who can do what

| Role | Can |
|---|---|
| Wallet owner | Deposit, withdraw, add/update/revoke agents, set recipient rules, pause, approve and reject requests. |
| Agent | Pay within its limits and create approval requests. Nothing else. |
| Anyone | Read everything, and release requests that can no longer be approved (`expireRequest`). |
| Aider team | Nothing. The contract has no admin, no owner role and no upgrade path. |

## A leaked agent key

| A leaked agent key CAN | A leaked agent key CAN'T |
|---|---|
| Spend up to the agent's daily limit per UTC day (up to twice that across UTC midnight) until you revoke it | Withdraw your funds |
| Make single payments only up to the per-payment limit | Raise its own limits, change its expiry or add agents |
| Create up to 10 open requests (v2) that reserve money until you reject or release them | Approve its own requests |
| Pay only recipients your rules allow | Spend anything after you revoke it or pause the wallet |
| | Pay the Aider contract or the USDC token (v2) |

So the most you can lose to a leaked agent key is roughly its daily limit for each UTC day it stays active. Revoke it as soon as you notice.

## The owner key

Your owner key controls everything in your wallet. Keep it in a browser or hardware wallet, never on an agent's machine. Version 2 of the contract refuses to add the owner's address as an agent (`OwnerCannotBeAgent`), and the CLI refuses the owner's key in `aidr init`.

## Where the agent key lives

`aidr init` stores the agent's key in `~/.aidr/key` and its settings in `~/.aidr/config.json`. The folder is created with mode 700 and the files with mode 600, so only that user can read them. The CLI never prints the key and redacts it from every output.

Pass the key with the `AIDR_AGENT_KEY` environment variable rather than `--key`, so it doesn't end up in your shell history.

## What the contract guarantees

- Every payment is checked against every rule in the same transaction that pays it.
- Reserved money can't be withdrawn or spent until its request is decided or released.
- The sum of all wallet balances always equals the USDC the contract holds, because the only ways in and out are `deposit`, `withdraw`, `agentPay` and approved requests (v2 refuses payments to the contract itself, which would otherwise strand funds).

## Next

See every failure and what to do about it in [errors](/docs/errors).
