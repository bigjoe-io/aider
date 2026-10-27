# Aider

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## Deployed Contracts

| Contract | Network | Address |
|---|---|---|
| Leash (v1) | Arc Testnet | 0xed32e15d81e7864bf19caea4333bd0781f328ba3 |
| Aider (v2) | Arc Testnet | 0xeb0d286eb7ce6ae7b211511db66a6ed94bf416b2 |

Aider v2 deploy tx: `0xc32daa824f41a5931362f866c11bfba24bd47fa2eb1872e0abfb9298a9d12177`  
Explorer: https://explorer.testnet.arc.io/address/0xeb0d286eb7ce6ae7b211511db66a6ed94bf416b2  
Deployed: 2026-10-26T23:26:55.526Z

## What This App Does

Aider: a USDC wallet for AI agents on Arc. A human owner creates wallets, deposits USDC, and gives AI agents spending keys with per-payment and daily limits and an expiry. Small payments execute automatically; larger ones become approval requests with the funds reserved, which the owner approves or rejects. Agents can be revoked and wallets paused instantly. All USDC handling uses the ERC-20 interface at 0x3600000000000000000000000000000000000000 (6 decimals).

## Tech Stack

- Frontend: Next.js 16 (App Router, `src/app`), React 19, TypeScript 7, Tailwind CSS 3
- Web3: wagmi v2, viem v2, our own connect dialog (`src/components/wallet`)
- Contracts: Solidity 0.8.28 + Foundry. Source `contracts/Aider.sol`, tests `contracts/test/*.t.sol` (91 tests). Build with `bun run contracts:build`, test with `bun run contracts:test`.
- CLI: `cli/` (`aidr`, commander + viem), agent instructions in `cli/SKILL.md`, tests with `cd cli && bun test`
- Chain: Arc Testnet (5042002) by default; Arc mainnet (5042) via `NEXT_PUBLIC_AIDER_NETWORK=mainnet` + `NEXT_PUBLIC_AIDER_CONTRACT`
- Token: USDC (6 decimals) at 0x3600000000000000000000000000000000000000
- Toasts: Sonner

## Key Files

- `src/app/page.tsx` - landing page (sections in `src/components/landing/`)
- `src/app/app/` - owner app: overview, agents, approvals, activity, rules (`src/components/app/`)
- `src/app/docs/` + `src/docs/content/*.md` - docs, rendered by `src/docs/markdown.tsx`
- `src/proxy.ts` - serves the docs at the root of `docs.*` hosts
- `src/aider/` - contract config, ABI, event indexer (`logs.ts`), hooks, error messages
- `src/config.ts` - wagmi config (chains, connectors, transports)
- `src/onchain-*.ts`, `src/tracing.ts`, `src/console-capture.ts` - Arc Studio generated; don't edit. The tracing files are loaded in the browser only (`src/app/providers.tsx`).

## To Run

```bash
bun install
bun run dev        # http://localhost:5173, docs also at http://docs.localhost:5173
```
