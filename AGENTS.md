# [App Name]

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## Deployed Contracts

| Contract | Network | Address |
|---|---|---|
| Leash | Arc Testnet | 0xed32e15d81e7864bf19caea4333bd0781f328ba3 |

## What This App Does

Leash: a USDC wallet for AI agents on Arc. A human owner creates wallets, deposits USDC, and grants AI agents spending keys with per-payment and daily limits. Small payments execute automatically; larger ones create a reservation and wait for owner approval. Agents can be revoked instantly. All USDC handling uses the ERC-20 interface at 0x3600000000000000000000000000000000000000.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
