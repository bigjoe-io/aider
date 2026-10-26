---
title: SKILL.md
summary: The instructions an AI agent follows to pay safely with aidr.
group: Reference
order: 15
tags: quickstart-agents, cli-reference, best-practices
---

## What it is

`SKILL.md` is a short instruction file for AI agents. It explains how to set up `aidr`, what each command prints, what every error means and the rules an agent must follow, such as checking its balance first, writing honest memos and never splitting a payment to get under a limit.

## How to give it to an agent

- **Claude Code and other coding agents:** add the file to your project (for example as a skill), or tell the agent to read it before it pays for anything.
- **Any agent with web access:** point it at [/skill.md](/skill.md) on this site.
- **Agents that read docs:** [/llms.txt](/llms.txt) indexes every page and links to this file.

## The file

```include
skill.md
```
