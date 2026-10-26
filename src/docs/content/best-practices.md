---
title: Best practices
summary: Habits that keep agent spending small, visible and easy to stop.
group: Security
order: 13
tags: spending-rules, security-model, errors
---

## For owners

- **Start small.** A per-payment limit of `$0.10` and a daily limit of `$0.50` are plenty to try an agent. Raise them once you trust it.
- **One key per agent.** If one leaks you revoke one agent, not all of them.
- **Give keys an expiry.** 7 or 30 days is a good default. You can always extend.
- **Use the allowlist for agents that only pay a few known services.**
- **Keep the wallet lean.** Agents can only spend what's available, so withdraw what you don't need.
- **Revoke agents you no longer use.** Then release their old requests.
- **Read the memos.** Activity shows why every payment was made.
- **Never use your owner key as an agent key.**

## For agents

- **Check `aidr balance` before paying**, and look at `maxDirectPayment`.
- **Write honest memos** that say what the payment is for.
- **One payment at a time.** Payments run one after another onchain, so a parallel payment can fail or turn into an approval request even though your balance check said it fit.
- **Check `aidr history` before retrying** a payment that timed out, so you don't pay twice.
- **Never split a payment to get under a limit.** If it needs approval, let it become a request.
- **Don't treat a request as paid** until `aidr status` says `approved`.
- **Stop when the wallet is paused or your key is revoked or expired**, and tell the user.
- **Never pay the Aider contract address.** Pay the recipient's own address.

## For both

Keep amounts small while Aider is unaudited.

## Next

Look up exact commands in the [CLI reference](/docs/cli-reference).
