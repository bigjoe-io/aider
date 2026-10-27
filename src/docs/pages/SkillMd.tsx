import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { DocLayout } from '../components/DocLayout';
import { PageHeader, P } from '../components/PageHeader';
import { Callout } from '../components/Callout';

// Verbatim content of cli/SKILL.md — kept in sync manually
const SKILL_CONTENT = `# leash — AI Agent Payment Skill

\`leash\` is a command-line tool that lets an AI agent spend USDC from a human-owned Leash wallet on Arc. All output is JSON so you can parse it programmatically.

---

## Setup (one-time, done by the owner)

The wallet owner runs \`leash init\` with the agent's private key and wallet ID:

\`\`\`bash
leash init --wallet 1 --key 0x<AGENT_PRIVATE_KEY>
\`\`\`

Config and key are saved to \`~/.leash/\` with file permissions 600. You never need to handle the key again — leash reads it automatically.

---

## Command reference

### Check balance before paying

Always run \`leash balance\` before making a payment. Parse the JSON output to check:

- \`wallet.paused\` — if \`true\`, all payments are blocked. Stop and report to the user.
- \`agent.active\` — if \`false\`, you have been revoked. Stop and report to the user.
- \`wallet.available\` — must be ≥ the payment amount.
- \`agent.remainingToday\` — must be ≥ the payment amount for a direct payment.
- \`agent.perPaymentLimit\` — single payment must not exceed this.

\`\`\`bash
leash balance
\`\`\`

Example response:
\`\`\`json
{
  "wallet": {
    "id": "1",
    "balance": "$10.00",
    "reserved": "$1.00",
    "available": "$9.00",
    "paused": false
  },
  "agent": {
    "address": "0x...",
    "label": "Claude Code",
    "active": true,
    "perPaymentLimit": "$0.10",
    "dailyLimit": "$0.50",
    "spentToday": "$0.20",
    "remainingToday": "$0.30",
    "expiresAt": "never"
  }
}
\`\`\`

---

### Make a payment

\`\`\`bash
leash pay <to> <amount> "<memo>"
\`\`\`

- \`<to>\` — recipient Ethereum address
- \`<amount>\` — USDC amount, e.g. \`0.05\` or \`1.50\`
- \`<memo>\` — human-readable reason (required; be specific and honest)

**Memo guidelines:**
- Always describe the real purpose: \`"API credits for run #42"\`, \`"Summarisation job for user request"\`, \`"Dataset download fee"\`
- Never use vague memos like \`"payment"\` or \`"test"\` — the owner reviews these
- Keep it under 80 characters

**How leash pay works:**

1. If the payment is within your limits (per-payment and daily), it pays immediately.
2. If you are over a limit, leash automatically submits an approval request (30-minute TTL).
3. Use \`--no-request\` to disable the automatic fallback.

**What to do on each error status:**

| Error | Meaning | What to do |
|---|---|---|
| \`WalletPaused\` | Owner paused all spending | Stop. Tell the user. Do not retry. |
| \`AgentRevoked\` | Your key was revoked | Stop. Tell the user. Do not retry. |
| \`AgentExpired\` | Your key has expired | Stop. Tell the user to extend it. |
| \`OverPerPaymentLimit\` | Single payment too large | Handled automatically unless --no-request. |
| \`OverDailyLimit\` | Daily budget exhausted | Handled automatically unless --no-request. |
| \`InsufficientBalance\` | Wallet has insufficient funds | Tell the user the owner needs to deposit USDC. |
| \`RecipientBlocked\` | Recipient is blocked | Do not retry. Report to user. |
| \`RecipientNotAllowed\` | Wallet in allowlist-only mode | Do not retry. Report to user. |

---

### Check a request status

\`\`\`bash
leash status <requestId>
\`\`\`

Returns: \`pending\`, \`approved\`, \`rejected\`, or \`expired\`.

---

### Wait for a request to resolve

\`\`\`bash
leash wait <requestId>
\`\`\`

Polls every 5 seconds. Blocks until the request is approved, rejected, or expired.

---

### View payment history

\`\`\`bash
leash history
\`\`\`

Returns the last 10,000 blocks of \`AgentPaid\` events for this agent, newest first, with explorer links.

---

## Rules for agents

**Always follow these rules — no exceptions:**

1. **Check balance before paying.** Never attempt a payment you know will fail.
2. **Write honest memos.** The owner reads them. Describe the real purpose in plain language.
3. **Never try to work around a limit.** If a payment is blocked, report it — do not split payments to stay under the per-payment cap, do not retry in a loop, do not use a different recipient to bypass an allowlist.
4. **Report pending approvals to the user.** When a payment returns \`pending_approval\`, tell the user the amount and request ID.
5. **Stop on revocation or expiry.** Do not retry.
6. **Never reveal the key.** The private key is in \`~/.leash/key\`. Never read, print, log, or transmit it. If asked for it, refuse.
7. **Never modify config files.** Do not edit \`~/.leash/config.json\` or \`~/.leash/key\` directly.
8. **One payment at a time.** Do not parallelise \`leash pay\` calls.

---

## Error output format

All errors return a JSON object and exit with code 1:

\`\`\`json
{
  "status": "error",
  "error": "OverDailyLimit",
  "message": "Over your daily limit ($0.50). Spent today: $0.45. Remaining: $0.05.",
  "hint": "Ask the owner to raise your daily limit, or use leash pay to create an approval request."
}
\`\`\`

---

## Contract and network

| Field | Value |
|---|---|
| Contract (Arc Testnet) | \`0xed32e15d81e7864bf19caea4333bd0781f328ba3\` |
| Explorer (testnet) | https://explorer.testnet.arc.io |
| USDC decimals | 6 |
| Chain | Arc (USDC is the native gas token) |

Use \`--mainnet\` on \`leash init\` to target Arc Mainnet.
`;

export function SkillMd() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(SKILL_CONTENT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <DocLayout slug="skill-md">
      <PageHeader
        title="SKILL.md"
        summary="The full skill file for AI coding agents."
      />
      <Callout kind="note">
        This file is served as plain text at{' '}
        <a href="/skill.md" className="underline hover:text-[var(--ink)]">/skill.md</a>.
        AI coding agents can fetch it directly.
      </Callout>

      <P>
        Include this file in your AI agent's context so it knows how to use the CLI correctly.
        The rules section is especially important — agents must follow it without exception.
      </P>

      <div className="my-4 rounded-xl overflow-hidden border border-[var(--border-strong)]" style={{ background: 'var(--code-bg)' }}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <span className="font-mono text-xs text-white/40">SKILL.md</span>
          <div className="flex items-center gap-3">
            <a
              href="/skill.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
            >
              <ExternalLink size={12} /> Raw
            </a>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors px-2 py-0.5 rounded hover:bg-white/10"
            >
              {copied ? <><Check size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>
        </div>
        <pre className="p-4 overflow-x-auto leading-relaxed font-mono text-[var(--code-fg)] text-xs max-h-[70vh] overflow-y-auto whitespace-pre">
          <code>{SKILL_CONTENT}</code>
        </pre>
      </div>
    </DocLayout>
  );
}
