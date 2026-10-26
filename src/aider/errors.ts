/**
 * Turns any wallet / RPC / contract error into a short, friendly message.
 * Covers every Aider custom error (v1 + v2), the contract's `require` strings, user rejection,
 * chain mismatch and missing gas funds. Safe on server and client.
 */
import {
  BaseError,
  ChainMismatchError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
} from 'viem'

export interface DecodedError {
  /** Contract error name, require string, or a synthetic code (UserRejected, ChainMismatch, …). */
  name: string
  /** Short title for a toast. */
  title: string
  /** One or two sentences for the user. */
  message: string
}

/** Friendly copy for every contract error and require string. */
export const AIDER_ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  // --- custom errors (v1) ---
  NotWalletOwner: { title: 'Not your wallet', message: 'Only the owner of this Aider wallet can do that. Switch to the owner account.' },
  WalletPaused: { title: 'Wallet is paused', message: 'Every agent is stopped while the wallet is paused. Resume it to let agents pay again.' },
  AgentNotActive: { title: 'Agent not active', message: 'This address is not an active agent on the wallet. Add it first, or check the address.' },
  AgentRevokedError: {
    title: 'Agent was revoked',
    message: 'This agent has been revoked, so its payments and open requests can no longer go through. Reject the request to release the funds.',
  },
  AgentExpired: { title: 'Agent expired', message: "This agent's access has expired. Extend its expiry or re-add it to let it pay again." },
  RecipientNotAllowed: { title: 'Recipient not on the allowlist', message: 'The wallet only pays allowlisted addresses. Add the recipient on the Rules page.' },
  RecipientBlocked: { title: 'Recipient is blocked', message: 'That recipient is on the wallet blocklist. Remove it on the Rules page to pay it.' },
  OverPerPaymentLimit: { title: 'Over the per-payment limit', message: "The amount is above this agent's per-payment limit. It can request approval instead." },
  OverDailyLimit: { title: 'Over the daily limit', message: "This payment would go past the agent's daily limit for today (UTC). It can request approval instead." },
  InsufficientBalance: { title: 'Not enough available balance', message: 'The wallet does not have enough available USDC (balance minus reserved). Deposit more first.' },
  RequestNotPending: { title: 'Request already handled', message: 'This request was already approved, rejected or released.' },
  RequestExpiredError: { title: 'Request expired', message: 'The approval window for this request has passed. Release its funds and ask the agent to try again.' },
  ZeroAmount: { title: 'Amount is zero', message: 'Enter an amount greater than $0.' },
  ZeroAddress: { title: 'Missing address', message: 'The zero address is not allowed here. Check the address.' },
  InvalidTTL: { title: 'Invalid approval window', message: 'The request must expire between 1 second and 7 days from now.' },
  RequestNotExpiredYet: { title: 'Not expired yet', message: 'This request can still be approved or rejected. Its funds can be released once it expires.' },
  // --- custom errors (v2) ---
  RequestNotFound: { title: 'Request not found', message: 'No request with that id exists on this contract.' },
  InvalidRecipient: {
    title: 'Invalid recipient',
    message: 'Payments to the Aider contract or the USDC token contract would strand the funds, so they are refused.',
  },
  OwnerCannotBeAgent: { title: 'Owner cannot be an agent', message: "Use a separate key for the agent — the wallet owner's address can't be added as an agent." },
  InvalidExpiry: { title: 'Expiry is in the past', message: 'Pick an expiry date in the future, or "Never".' },
  TooManyOpenRequests: {
    title: 'Too many open requests',
    message: 'This agent already has 10 open requests on this wallet. Approve, reject or release some first.',
  },
  ReentrancyGuardReentrantCall: { title: 'Call rejected', message: 'The contract refused a re-entrant call.' },
  // --- require strings ---
  WALLET_NOT_FOUND: { title: 'Wallet not found', message: 'No Aider wallet exists with that id on this network.' },
  USDC_TRANSFER_FROM_FAILED: {
    title: 'USDC transfer failed',
    message: 'The deposit could not pull USDC from your account. Check your USDC balance and approval.',
  },
  USDC_TRANSFER_FAILED: { title: 'USDC transfer failed', message: 'The USDC token refused the transfer.' },
  // --- synthetic ---
  UserRejected: { title: 'Cancelled', message: 'You rejected the request in your wallet.' },
  ChainMismatch: { title: 'Wrong network', message: 'Your wallet is on a different network. Switch networks and try again.' },
  InsufficientGas: {
    title: 'Not enough USDC for gas',
    message: 'Arc charges gas in USDC. Add a little USDC to your account (the testnet faucet works) and try again.',
  },
  TransactionReverted: { title: 'Transaction failed', message: 'The transaction was mined but reverted. Nothing changed.' },
  NotDeployed: { title: 'Aider is not deployed here', message: 'There is no Aider contract configured for this network yet.' },
  Unknown: { title: 'Something went wrong', message: 'The transaction could not be completed. Try again in a moment.' },
}

function make(name: string, fallbackDetail?: string): DecodedError {
  const known = AIDER_ERROR_MESSAGES[name]
  if (known) return { name, ...known }
  return { name, title: AIDER_ERROR_MESSAGES.Unknown.title, message: fallbackDetail || AIDER_ERROR_MESSAGES.Unknown.message }
}

const NAME_IN_TEXT = new RegExp(`\\b(${Object.keys(AIDER_ERROR_MESSAGES).join('|')})\\b`)

function hasCode(e: unknown, code: number): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && (e).code === code
}

/** Decode any thrown value from wagmi/viem/a wallet into a friendly message. */
export function decodeAiderError(err: unknown): DecodedError {
  if (err instanceof BaseError) {
    const rejected = err.walk((e) => e instanceof UserRejectedRequestError || hasCode(e, 4001))
    if (rejected) return make('UserRejected')

    const reverted = err.walk((e) => e instanceof ContractFunctionRevertedError)
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName
      if (name && name !== 'Error') return make(name)
      if (reverted.reason) return make(reverted.reason, reverted.reason)
    }

    if (err.walk((e) => e instanceof ChainMismatchError)) return make('ChainMismatch')
    if (err.walk((e) => e instanceof InsufficientFundsError)) return make('InsufficientGas')

    const text = `${err.shortMessage} ${err.details ?? ''} ${err.message}`
    const m = NAME_IN_TEXT.exec(text)
    if (m) return make(m[1])
    if (/insufficient funds/i.test(text)) return make('InsufficientGas')
    if (/chain mismatch|does not match the target chain/i.test(text)) return make('ChainMismatch')
    if (/user (rejected|denied)/i.test(text)) return make('UserRejected')
    return make('Unknown', err.shortMessage)
  }

  if (hasCode(err, 4001)) return make('UserRejected')
  if (err instanceof Error) {
    if (err.name === 'TransactionRevertedError') return make('TransactionReverted')
    const m = NAME_IN_TEXT.exec(err.message)
    if (m) return make(m[1])
    if (/user (rejected|denied)/i.test(err.message)) return make('UserRejected')
    if (/insufficient funds/i.test(err.message)) return make('InsufficientGas')
    return make('Unknown', err.message.slice(0, 200))
  }
  return make('Unknown')
}

/** Error thrown by useAiderWrite when a mined receipt has status "reverted". */
export class TransactionRevertedError extends Error {
  readonly hash: `0x${string}`
  constructor(hash: `0x${string}`) {
    super(`Transaction ${hash} reverted`)
    this.name = 'TransactionRevertedError'
    this.hash = hash
  }
}

/** True for a wallet "user rejected" error (no toast needed beyond "Cancelled"). */
export function isUserRejection(err: unknown): boolean {
  return decodeAiderError(err).name === 'UserRejected'
}
