# Aider

**Your agent spends. You stay in control.**

Aider is a USDC wallet for AI agents on [Arc](https://arc.io). A human owner keeps the funds in a wallet inside the Aider contract; each AI agent gets its own key with a per-payment limit, a daily limit and an expiry. Payments within the limits go through at once, bigger ones become approval requests with the money reserved, and the owner can revoke an agent or pause the wallet instantly.

Built with [Arc Studio](https://studio.arc.io).

> Experimental and unaudited. Use small amounts.

## What's in this repo

| Path | What it is |
|---|---|
| `contracts/Aider.sol` | The contract (Solidity 0.8.28, Foundry). Tests in `contracts/test/`. |
| `src/app` | The Next.js app: landing page (`/`), owner app (`/app`), docs (`/docs`), agent files (`/llms.txt`, `/llms-full.txt`, `/skill.md`). |
| `src/docs/content` | The docs pages, as Markdown. |
| `src/proxy.ts` | Serves the docs at the root of any `docs.*` host. |
| `cli/` | `aidr`, the command-line tool agents use, and `cli/SKILL.md`, the instructions for AI agents. |

## Run it locally

Requires [Bun](https://bun.sh) and Node 18+.

```bash
bun install
bun run dev
```

| URL | Page |
|---|---|
| http://localhost:5173 | Landing page |
| http://localhost:5173/app | Owner app |
| http://localhost:5173/docs | Docs |
| http://docs.localhost:5173 | The same docs on their own host (how `docs.<your-domain>` works in production) |

The app talks to the Aider contract on **Arc Testnet** by default. To try it you need a browser wallet (MetaMask etc.) and some testnet USDC from [faucet.circle.com](https://faucet.circle.com).

### Configuration

Copy `.env.example` to `.env.local`. All variables are optional:

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_AIDER_NETWORK` | `testnet` | `testnet` (Arc Testnet) or `mainnet` (Arc). |
| `NEXT_PUBLIC_AIDER_CONTRACT` | testnet deployment | The Aider contract address. Required for mainnet. |
| `NEXT_PUBLIC_AIDER_DEPLOY_BLOCK` | `69187895` on the default testnet contract | Where the activity indexer starts reading events. |
| `NEXT_PUBLIC_AIDER_RPC_URL` | Arc's public RPC | A dedicated RPC. Recommended in production: the public RPC rate-limits. |
| `NEXT_PUBLIC_AIDER_GITHUB_URL`, `NEXT_PUBLIC_AIDER_X_URL` | | Links in the nav and footer. |

### Scripts

```bash
bun run dev              # next dev on :5173
bun run build            # production build (prerenders every docs page)
bun run typecheck        # TypeScript 7
bun run contracts:build  # forge build
bun run contracts:test   # forge test (91 tests)
bun run abi:gen          # regenerate src/aider/abi.ts from contracts/out
```

## The contract

`contracts/Aider.sol` is version 2 of the contract first deployed as `Leash`. Every v1 function, event and error keeps its exact signature; v2 adds safety checks:

- payments to the Aider contract or the USDC token are refused (`InvalidRecipient`), so funds can't get stranded;
- re-adding an agent keeps what it already spent today, so its daily limit can't be reset;
- revoking an agent voids its open approval requests (they can't be approved, and anyone can release the reserved money);
- request TTL is capped at 7 days, and each agent can have at most 10 open requests per wallet;
- the owner can't be added as an agent; agent expiry must be in the future;
- unknown request ids revert with `RequestNotFound`;
- `getAgent` returns today's real spending after UTC midnight;
- new: `rejectRequests`, `expireRequests`, `getRequestState`, `openRequestCount`.

See the [contract reference](src/docs/content/contract-reference.md) for every function and the v1/v2 differences.

| Network | Address |
|---|---|
| Arc Testnet | `0xed32e15d81e7864bf19caea4333bd0781f328ba3` (v1 build, deploy block 69187895) |
| Arc mainnet | not deployed yet |

## The `aidr` CLI

```bash
cd cli && bun install && bun run build && npm link
aidr setup --name "Claude Code"  # makes the agent's key, prints a link for the owner
# the owner opens the link and clicks Add agent
aidr balance
aidr pay 0xRecipient 0.05 "API credits"
aidr wait 42
```

Every command prints one JSON object. See the [CLI reference](src/docs/content/cli-reference.md) and [cli/SKILL.md](cli/SKILL.md).

## License

MIT
