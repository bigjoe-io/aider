---
title: Use it with Claude
summary: Let Claude Code pay for you, with example prompts and ideas for what to pay for.
group: Get started
order: 5
meta: Works with=Claude Code and other agents that can run terminal commands
tags: quickstart, skill-md, agent-to-agent
---

## Set up once

1. Finish the [quickstart](/docs/quickstart) so `aidr balance` shows `"status": "active"`.
2. Start Claude Code in a terminal:

```bash title="Terminal"
claude
```

3. Give it the rules. Paste this as your first message:

```text title="Message to Claude"
Read https://aider-smoky.vercel.app/skill.md. Use the aidr command to pay for things, and follow its rules.
```

## What to say

```text title="Check the budget"
How much can you still spend today? Use aidr balance.
```

```text title="Pay"
Pay 0.05 USDC to 0x90F79bf6EB2c4f870365E785982E1f101E93b906 for "Translation job #1".
```

```text title="A bigger payment"
Pay 1 USDC to 0x90F79bf6EB2c4f870365E785982E1f101E93b906 for "Premium dataset", then wait for my approval.
```

Claude creates an approval request and tells you. Approve it in the app under **Approvals**.

```text title="Check history"
Show me the last 5 payments you made.
```

## What agents can pay for

An agent pays a USDC **address on Arc**. Anything with an address can be paid:

| Idea | Example |
|---|---|
| Another agent | Pay a translation agent 0.05 USDC per job. |
| A person | Pay a 0.50 USDC bounty for a bug fix. |
| A paid API | Pay per request to an API that accepts USDC on Arc. |
| A bigger purchase | Ask for 2 USDC for a dataset and wait for your approval. |

An agent can't pay with a card or check out on a normal website.

## Try the safety controls

1. Ask Claude to pay something small. It goes through.
2. In the app, click **Revoke** on the agent.
3. Ask again. The payment is blocked and Claude tells you why.

## Claude desktop app and ChatGPT

These apps can't run terminal commands, so they can't use `aidr` yet. Use Claude Code, or another agent that can run commands.

## Next

Read the rules Claude follows in [SKILL.md](/docs/skill-md), and good habits in [best practices](/docs/best-practices).
