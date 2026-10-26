---
title: Watching activity
summary: Every event the contract emits, and how to follow them in the app or your own code.
group: Core concepts
order: 10
tags: contract-reference, agent-to-agent, how-it-works
---

## Events

Everything that changes a wallet emits an event. Indexed fields can be used as filters.

| Event | Fields (indexed in bold) | When |
|---|---|---|
| `WalletCreated` | **walletId**, **owner** | A wallet is created |
| `Deposited` | **walletId**, amount | The owner deposits |
| `Withdrawn` | **walletId**, amount | The owner withdraws |
| `WalletPausedEvent` | **walletId**, paused | Pause or resume |
| `AgentAdded` | **walletId**, **agent**, label | An agent is added or re-added |
| `AgentUpdated` | **walletId**, **agent** | Limits or expiry changed |
| `AgentRevoked` | **walletId**, **agent** | An agent is revoked |
| `AgentPaid` | **walletId**, **agent**, **to**, amount, memo | A direct payment |
| `PaymentRequested` | **requestId**, **walletId**, **agent**, to, amount, memo, expiresAt | A request is created |
| `RequestApproved` | **requestId**, **walletId** | A request is approved and paid |
| `RequestRejected` | **requestId**, **walletId** | A request is rejected |
| `RequestExpired` | **requestId**, **walletId** | A request is released |
| `RecipientModeSet` | **walletId**, mode | Anyone / allowlist only |
| `AllowlistUpdated` | **walletId**, recipient, allowed | Allowlist change |
| `BlocklistUpdated` | **walletId**, recipient, blocked | Blocklist change |

## In the app

**Activity** lists every event for your wallet with the memo, amounts and an explorer link, and filters by type and agent. The app reads the events straight from Arc in windows of up to 10,000 blocks (the RPC's limit) and caches what it has read in your browser.

## In your own code

A short script with [viem](https://viem.sh) that lists one wallet's direct payments:

```ts title="payments.ts"
import { createPublicClient, http, parseAbiItem } from 'viem'
import { arcTestnet } from 'viem/chains'

const client = createPublicClient({ chain: arcTestnet, transport: http() })
const latest = await client.getBlockNumber()

const logs = await client.getLogs({
  address: '0xed32e15d81e7864bf19caea4333bd0781f328ba3',
  event: parseAbiItem('event AgentPaid(uint256 indexed walletId, address indexed agent, address indexed to, uint256 amount, string memo)'),
  args: { walletId: 1n },
  fromBlock: latest - 9_999n, // the RPC allows at most 10,000 blocks per call
  toBlock: latest,
})

for (const log of logs) console.log(log.args.to, log.args.amount, log.args.memo)
```

To follow events live, use `watchContractEvent` with the same `address`, `event` and `args`.

## On the explorer

Every transaction has an explorer link in the app and in the CLI output. On Arc Testnet the explorer is [explorer.testnet.arc.io](https://explorer.testnet.arc.io).

## Next

Read the [security model](/docs/security-model).
