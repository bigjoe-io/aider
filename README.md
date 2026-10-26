# Leash

A USDC smart-contract wallet for AI agents on Arc. A human owner holds the funds; AI agents get scoped spending keys with per-payment and daily limits. Small payments execute immediately; larger ones create a reservation and wait for owner approval. Agents can be revoked instantly.

Built with [Arc Studio](https://studio.arc.io)

## Tech stack

- Smart contract: Solidity 0.8.28, Foundry, OpenZeppelin 5.6.1
- Chain: Arc Testnet (Chain ID 5042002) — deploys to Arc mainnet too
- USDC: ERC-20 at `0x3600000000000000000000000000000000000000` (same address on mainnet and testnet)

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Bun](https://bun.sh/)

### Install

```bash
bun install
```

### Environment variables

None required for contract development.

| Variable | Purpose |
|---|---|
| `RPC_PROXY_BASE_URL` | Arc Studio RPC proxy base URL (optional outside Arc Studio) |
| `RPC_PROXY_TOKEN` | Arc Studio RPC proxy auth token (optional outside Arc Studio) |
| `RPC_PROXY_CHAINS` | Comma-separated chain keys the proxy covers (optional outside Arc Studio) |

### Build and test contracts

```bash
bun run contracts:build   # forge build
bun run contracts:test    # forge test
```

### Run the dev server

```bash
bun run dev
```

## CLI: leash

The `cli/` folder is an npm package (`leash-cli`) for AI agents to pay from a Leash wallet.

```bash
cd cli
bun install
bun run build          # compiles to cli/dist/
node dist/index.js --help
```

**Usage:**

```bash
# One-time setup (agent side)
leash init --wallet 1 --key 0x<AGENT_PRIVATE_KEY>

# Check balance before paying
leash balance

# Pay (auto-falls back to approval request if over a limit)
leash pay 0xRecipient 0.05 "API credits"

# Track an approval request
leash status 42
leash wait 42

# View payment history
leash history
```

Key stores at `~/.leash/key` with mode 600. Config at `~/.leash/config.json`. Neither file is printed or logged.

See `cli/SKILL.md` for instructions written for AI coding agents.

## Contract: Leash

`contracts/Leash.sol` — single non-upgradeable contract.

**Key features:**

- Owners create wallets, deposit USDC, and withdraw unreserved funds at any time.
- Agents (AI keys) are scoped per wallet with a label, per-payment cap, daily cap, and optional expiry.
- Recipient policy: ANY recipient, or ALLOWLIST-only, with a separate blocklist.
- `agentPay` — executes immediately when all limits pass.
- `requestPayment` — reserves funds and waits for owner approval; useful when the amount exceeds agent limits.
- `approveRequest` / `rejectRequest` / `expireRequest` — owner or time-based resolution.
- Full view helpers including `getWallet`, `getAgent`, `getRequest`, `getPendingRequests`, `isAllowlisted`, `isBlocklisted`, `isRecipientPermitted`.
