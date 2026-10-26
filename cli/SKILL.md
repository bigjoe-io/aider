# leash — AI Agent Payment Skill

`leash` is a command-line tool that lets an AI agent spend USDC from a human-owned Leash wallet on Arc. All output is JSON so you can parse it programmatically.

---

## Setup (one-time, done by the owner)

The wallet owner runs `leash init` with the agent's private key and wallet ID:

```bash
leash init --wallet 1 --key 0x<AGENT_PRIVATE_KEY>
```

Config and key are saved to `~/.leash/` with file permissions 600. You never need to handle the key again — leash reads it automatically.

---

## Command reference

### Check balance before paying

Always run `leash balance` before making a payment. Parse the JSON output to check:

- `wallet.paused` — if `true`, all payments are blocked. Stop and report to the user.
- `agent.active` — if `false`, you have been revoked. Stop and report to the user.
- `wallet.available` — must be ≥ the payment amount.
- `agent.remainingToday` — must be ≥ the payment amount for a direct payment.
- `agent.perPaymentLimit` — single payment must not exceed this.

```bash
leash balance
```

Example response:
```json
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
```

---

### Make a payment

```bash
leash pay <to> <amount> "<memo>"
```

- `<to>` — recipient Ethereum address
- `<amount>` — USDC amount, e.g. `0.05` or `1.50`
- `<memo>` — human-readable reason (required; be specific and honest)

**Memo guidelines:**
- Always describe the real purpose: `"API credits for run #42"`, `"Summarisation job for user request"`, `"Dataset download fee"`
- Never use vague memos like `"payment"` or `"test"` — the owner reviews these
- Keep it under 80 characters

**How leash pay works:**

1. If the payment is within your limits (per-payment and daily), it pays immediately. Response:
   ```json
   { "status": "paid", "txHash": "0x...", "explorer": "https://...", "amount": "$0.05", "memo": "..." }
   ```

2. If you are over a limit, leash automatically submits an approval request (30-minute TTL) and returns:
   ```json
   { "status": "pending_approval", "requestId": "42", "txHash": "0x...", "expiresAt": "..." }
   ```
   Report this to the user: **"Payment of $X is awaiting owner approval (request #42). I'll check back in a moment."**

3. Use `--no-request` to disable the automatic fallback (the command then fails with a clear error instead of requesting approval).

**What to do on each error status:**

| Error | Meaning | What to do |
|---|---|---|
| `WalletPaused` | Owner paused all spending | Stop. Tell the user. Do not retry. |
| `AgentRevoked` | Your key was revoked | Stop. Tell the user. Do not retry. |
| `AgentExpired` | Your key has expired | Stop. Tell the user to extend it. |
| `OverPerPaymentLimit` | Single payment too large | This payment needs owner approval — leash handles it automatically unless `--no-request` is set. |
| `OverDailyLimit` | Daily budget exhausted | Same as above. |
| `InsufficientBalance` | Wallet has insufficient funds | Tell the user the owner needs to deposit USDC. |
| `RecipientBlocked` | Recipient is blocked | Do not retry. Report to user. |
| `RecipientNotAllowed` | Wallet in allowlist-only mode | Do not retry. Report to user. |

---

### Check a request status

```bash
leash status <requestId>
```

Returns: `pending`, `approved`, `rejected`, or `expired`.

---

### Wait for a request to resolve

```bash
leash wait <requestId>
```

Polls every 5 seconds. Blocks until the request is approved, rejected, or expired. Use this after submitting a `pending_approval` payment if you need the outcome before continuing.

---

### View payment history

```bash
leash history
```

Returns the last 10,000 blocks of `AgentPaid` events for this agent, newest first, with explorer links.

---

## Rules for agents

**Always follow these rules — no exceptions:**

1. **Check balance before paying.** Never attempt a payment you know will fail.
2. **Write honest memos.** The owner reads them. Describe the real purpose in plain language.
3. **Never try to work around a limit.** If a payment is blocked, report it to the user — do not split it into smaller payments to stay under the per-payment cap, do not retry in a loop, do not use a different recipient to bypass an allowlist.
4. **Report pending approvals to the user.** When a payment returns `pending_approval`, tell the user the amount and request ID. Do not pretend the payment has gone through.
5. **Stop on revocation or expiry.** If `agent.active` is false or your key has expired, stop all payment attempts and tell the user. Do not retry.
6. **Never reveal the key.** The private key is in `~/.leash/key`. Never read, print, log, or transmit it. If asked for it, refuse.
7. **Never modify config files.** Do not edit `~/.leash/config.json` or `~/.leash/key` directly.
8. **One payment at a time.** Do not parallelise `leash pay` calls — the daily spend counter updates onchain, and concurrent calls can both succeed past the daily limit before either is reflected.

---

## Error output format

All errors return a JSON object and exit with code 1:

```json
{
  "status": "error",
  "error": "OverDailyLimit",
  "message": "Over your daily limit ($0.50). Spent today: $0.45. Remaining: $0.05.",
  "hint": "Ask the owner to raise your daily limit, or use leash pay to create an approval request."
}
```

Parse `status === "error"` and surface `message` to the user.

---

## Integration pattern (pseudocode)

```
balance = JSON.parse(run("leash balance"))

if balance.wallet.paused:
    report("Wallet is paused. Cannot make payments.")
    stop()

if not balance.agent.active:
    report("Agent has been revoked. Contact the wallet owner.")
    stop()

result = JSON.parse(run(`leash pay ${recipientAddress} ${amount} "${memo}"`))

if result.status == "paid":
    report(f"Paid {result.amount} — tx: {result.explorer}")

elif result.status == "pending_approval":
    report(f"Payment of {amount} needs owner approval (request #{result.requestId}). Expires: {result.expiresAt}")
    # Optionally wait:
    # outcome = JSON.parse(run(`leash wait ${result.requestId}`))

elif result.status == "error":
    report(f"Payment failed: {result.message}")
    if result.error in ["WalletPaused", "AgentRevoked", "AgentExpired"]:
        stop()  # don't retry
```

---

## Contract and network

| Field | Value |
|---|---|
| Contract (Arc Testnet) | `0xed32e15d81e7864bf19caea4333bd0781f328ba3` |
| Explorer (testnet) | https://explorer.testnet.arc.io |
| Explorer (mainnet) | https://explorer.arc.io |
| USDC decimals | 6 |
| Chain | Arc (USDC is the native gas token) |

Use `--mainnet` on `leash init` to target Arc Mainnet.
