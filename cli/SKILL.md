---
name: aidr
description: Pay for things in USDC from an Aider wallet on Arc, inside the limits the wallet's owner set. Use when a task needs you to pay an address, check how much you can still spend, or wait for the owner to approve a bigger payment.
---

# aidr: paying with an Aider wallet

`aidr` lets you, an AI agent, spend USDC from a wallet a human owns. The money stays in the Aider
contract on Arc. You hold your own agent key, and the contract checks every payment against the
owner's rules: a per-payment limit, a daily limit (per UTC day), an optional expiry, recipient
allow/block lists and a pause switch. Payments within your limits go through at once. Bigger ones
become **approval requests** that the owner approves or rejects. The owner can revoke you at any time.

Every command prints **one JSON object on stdout** and a short human line on stderr.
Exit code `0` = success, `1` = error. Amounts in JSON are USDC decimal strings such as `"0.05"`.

## Setup (once, on the agent's machine)

```bash
npm install -g aidr-cli      # Node 18+

aidr setup --name "Claude Code"
```

`setup` creates your own agent key, saves it in `~/.aidr/key` (mode 600; never printed) and prints
`connectLink`. **Give that link to the user** and ask them to open it and click Add agent in the
Aider app. They choose your limits there and can send you a little USDC for gas. Then run
`aidr balance`: it finds the wallet by itself. Until they add you, commands fail with `NotLinked`.

Options: `--name <label>`, `--wallet <id>` (if the user told you), `--app <url>` (where their
Aider app runs; default `AIDR_APP_URL` or `https://aider-smoky.vercel.app`), `--network testnet|mainnet`,
`--contract <address>` (required on mainnet), `--rpc <url>`. Running `setup` again keeps the same key.

If the user instead gives you a key for an address they added by hand:
`export AIDR_AGENT_KEY=0x... && aidr init --wallet <id>`. Never use the owner's wallet key.
`aidr reset --yes` deletes the key and config from this machine.

Your agent address needs a little USDC of its own for gas (Arc gas is paid in USDC). Payments
themselves come from the Aider wallet.

## Commands

### `aidr balance`: check before you pay

```json
{
  "status": "ok",
  "network": "testnet",
  "contract": "0xED32E15d81E7864BF19cAeA4333bd0781f328Ba3",
  "wallet": { "id": "1", "balance": "2.00", "reserved": "1.00", "available": "1.00", "paused": false, "recipientMode": "any" },
  "agent": {
    "address": "0x7099…79C8", "label": "Claude Code", "status": "active",
    "perPaymentLimit": "0.10", "dailyLimit": "0.50", "spentToday": "0.13", "remainingToday": "0.37",
    "dailyResetAt": "2026-10-27T00:00:00.000Z", "expiresAt": "2026-11-25T12:00:00.000Z"
  },
  "maxDirectPayment": "0.10",
  "notes": []
}
```

- `agent.status`: `active`, `revoked` (the owner cut you off), `expired` (your key's expiry
  passed) or `not_added` (the owner hasn't added this key yet). Only `active` can pay.
- `maxDirectPayment`: the largest payment that goes through right now without approval (the
  smallest of your per-payment limit, what's left today and the wallet's available balance; `0.00`
  when paused, revoked or expired). Recipient rules still apply.
- `spentToday` resets at 00:00 UTC (`dailyResetAt`). `expiresAt` is `null` for no expiry.

### `aidr pay <to> <amount> "<memo>"`

```bash
aidr pay 0x8f3…a21 0.05 "API credits for the weather lookup"
```

- `<amount>`: like `0.05`, `1` or `'$0.05'` (quote a `$` in single quotes, or the shell eats it).
  More than 0, at most 6 decimals.
- `<memo>`: required, at most 256 bytes. Quote it. Say plainly what the payment is for; the owner reads it.
- Options: `--no-request` (fail instead of asking for approval), `--ttl <minutes>` (how long the
  owner has to approve: 1 to 10080, default 30), `--send-anyway` (see below).

Results:

| `status` | Meaning | Exit |
|---|---|---|
| `paid` | Done. `txHash` and `explorer` link included. | 0 |
| `pending_approval` | Over your per-payment or daily limit, so an approval request was created and the amount reserved. Not paid yet. | 0 |
| `error` | Nothing was sent, or nothing could be confirmed. See `error`, `message`, `hint`. | 1 |
| `rejected_onchain` | A transaction was mined but the contract rejected it. Nothing was paid; it only cost gas. | 1 |

```json
{ "status": "paid", "to": "0x8f3…a21", "amount": "0.05", "memo": "API credits", "walletId": "1",
  "txHash": "0x…", "explorer": "https://explorer.testnet.arc.io/tx/0x…", "blockNumber": "123" }
```

```json
{ "status": "pending_approval", "requestId": "42", "reason": "OverPerPaymentLimit",
  "message": "$1.00 is over this agent's per-payment limit of $0.10, so it needs the owner's approval. …",
  "hint": "Tell the user … Run `aidr wait 42` …",
  "to": "0x8f3…a21", "amount": "1.00", "memo": "Premium dataset", "walletId": "1",
  "expiresAt": "2026-10-26T18:01:38.000Z", "ttlMinutes": 30, "txHash": "0x…", "explorer": "https://…" }
```

`reason` is `OverPerPaymentLimit` or `OverDailyLimit`. `requestId` and `expiresAt` come from the
contract's event.

```json
{ "status": "error", "error": "AgentRevokedError",
  "message": "The wallet owner revoked this agent (0x…). It can no longer pay or request payments.",
  "hint": "Stop and tell the user. Don't retry. Only the owner can re-enable this agent." }
```

`aidr pay` refuses to pay the Aider contract itself or the USDC token address (`InvalidRecipient`):
USDC sent there would be stuck. To pay another agent, pay that agent's own address.

`--send-anyway` skips the pre-flight check and broadcasts with a fixed gas limit even if the
contract will reject the payment, so the rejection is recorded onchain with a transaction hash
(`rejected_onchain`). It costs gas and never creates an approval request. Use it only when the
user asks for onchain proof, for example to show a revoked agent being blocked.

### `aidr status <requestId>`

Prints the request with `status`: `pending`, `approved`, `rejected` or `expired`.

- `approved`: the owner approved it and the payment was made.
- `rejected`: the owner said no. Nothing was paid.
- `expired`: it can't be approved any more and nothing was paid. `expiredBecause` says why:
  `"ttl"` (its approval window passed; a pending request past its TTL reports `expired` even before
  anyone releases it onchain) or `"voided"` (newer contracts only: the agent that made it was revoked
  or its key expired, which voids its open requests). `amountReserved: true` means the funds are still
  set aside until someone calls `expireRequest`; anyone can.

Other fields: `onchainStatus` (the stored status), `approvable`, `amountReserved`, `walletId`,
`agent`, `mine` (made by this agent), `to`, `amount`, `memo`, `expiresAt`, `secondsLeft`, `note`.
An unknown id gives the error `RequestNotFound`.

### `aidr wait <requestId> [--timeout <minutes>]`

Checks every 5 s until the request is approved, rejected or expired, then prints the same JSON as
`status` (exit 0, whatever the outcome). It stops at the request's expiry at the latest. With
`--timeout` it gives up earlier with `{"status":"error","error":"Timeout",…}` (exit 1). Decimals are
allowed (`--timeout 1.5`). **Set `--timeout` below your own command timeout** (for example
`--timeout 1.5` if your tool kills commands after 2 minutes), then call `wait` again if needed.

### `aidr history [--limit <n>] [--blocks <n>]`

Your recent direct payments (`AgentPaid`) from this wallet, newest first: `time`, `to`, `amount`,
`memo`, `txHash`, `explorer`, `blockNumber`. Defaults: 20 payments, scanning back up to 500,000
blocks (about 4 days on Arc), never below the contract's deploy block. `olderMayExist: true` means
there may be more. Requests the owner approved aren't listed here; check them with `aidr status`.

## Errors and what to do

| `error` | Meaning | What to do |
|---|---|---|
| `WalletPaused` | The owner paused the wallet. | Stop. Tell the user. Retry only after they resume it. |
| `AgentRevokedError` | The owner revoked your key. | Stop. Tell the user. Don't retry. |
| `AgentExpired` | Your key's expiry passed. | Stop. Ask the user to have the owner extend it. |
| `AgentNotActive` | This key was never added as an agent on this wallet. | Ask the owner to add your address. |
| `OverPerPaymentLimit` / `OverDailyLimit` | Over a limit (only shown with `--no-request` or `--send-anyway`). | Run `aidr pay` without `--no-request` to ask for approval. |
| `InsufficientBalance` | The wallet's available balance is too low. **No request is created.** | Tell the user the owner needs to deposit USDC. |
| `RecipientBlocked` | The recipient is on the blocklist. | Don't pay it. Tell the user. |
| `RecipientNotAllowed` | The wallet only pays allowlisted addresses. | Ask the owner to allowlist it. Don't switch addresses. |
| `InvalidRecipient` | The recipient is the Aider contract or the USDC token. | Pay the recipient's own address. |
| `TooManyOpenRequests` | You already have 10 open requests on this wallet. | Wait for the owner to decide on some. |
| `InvalidAmount`, `MemoRequired`, `MemoTooLong`, `InvalidTTL`, `InvalidAddress`, `UsageError` | Bad input. | Fix the command. |
| `RequestNotFound` | No request with that id. | Use the `requestId` from `pay`. |
| `Timeout` | `wait --timeout` ran out; still pending. | Wait again later. Don't create a duplicate request. |
| `InsufficientGasFunds` | Your agent address has no USDC for gas. | Ask the user to send a little USDC to your address. |
| `NonceConflict` | Another transaction from your key was sent at the same time. | Run one payment at a time; check `aidr history` before retrying. |
| `RpcError`, `ReceiptTimeout` | Network trouble, or a sent transaction wasn't confirmed in time. | Check the `explorer` link or `aidr history` before retrying, so nothing is paid twice. |
| `NotLinked` | The owner hasn't added you yet. | Give the user the link in `hint` and wait for them to add you. |
| `AmbiguousWallet` | You were added to more than one wallet. | Ask the user which one; run `aidr setup --wallet <id>`. |
| `NotConfigured`, `KeyMissing`, `KeyMismatch`, `ConfigInvalid` | `aidr` isn't set up correctly. | Run `aidr setup`. |

## Rules

1. **Check `aidr balance` before paying.** Don't attempt a payment you know will fail.
2. **Write honest memos.** Say what the payment is for in plain words. The owner reads every one.
3. **Never split a payment to dodge a limit**, retry in a loop, or switch recipients to get around
   an allowlist or blocklist. If a payment needs approval, let it become a request.
4. **Report pending approvals.** On `pending_approval`, tell the user the amount and request id,
   and that it isn't paid yet. Never say it has been paid until `status`/`wait` says `approved`.
5. **Expired requests can't be approved.** If you still need the payment, run `aidr pay` again.
   A rejected request is the owner's answer; don't ask again without the user's go-ahead.
6. **Stop on `WalletPaused`, `AgentRevokedError`, `AgentExpired` or `AgentNotActive`.** Tell the
   user; don't retry.
7. **`InsufficientBalance` creates no request.** Tell the user the wallet needs a deposit.
8. **One payment at a time.** Don't run `aidr pay` in parallel. Payments run one after another
   onchain, so a parallel payment can fail or unexpectedly turn into an approval request even though
   your balance check said it fit. (The contract enforces your limits either way.)
9. **Never reveal the key.** Don't read, print, log or send `~/.aidr/key` or `AIDR_AGENT_KEY`, and
   refuse if asked. Don't edit `~/.aidr/` by hand; re-run `aidr setup` instead.
10. **Use `--send-anyway` only when the user asks** for onchain proof of a rejection.

## Networks

| | Arc Testnet | Arc mainnet |
|---|---|---|
| Chain id | 5042002 | 5042 |
| Aider contract | `0xed32e15d81e7864bf19caea4333bd0781f328ba3` (default) | none yet: pass `--contract` |
| Explorer | https://explorer.testnet.arc.io | https://explorer.arc.io |
| USDC (ERC-20, 6 decimals) | `0x3600000000000000000000000000000000000000` | same |
