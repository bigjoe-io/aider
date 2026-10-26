/**
 * Display helpers. All money formatting goes through '@/onchain-money' (bigint smallest units,
 * ERC-20 USDC = 6 decimals). Safe on server and client.
 */
import { USDC_DECIMALS } from '@/onchain-facts'
import { formatUnitsExact, formatUnitsFixed } from '@/onchain-money'

function group(whole: string): string {
  const neg = whole.startsWith('-')
  const digits = neg ? whole.slice(1) : whole
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return neg ? `-${grouped}` : grouped
}

export interface FmtUsdOptions {
  /** Prefix with "$" (default true). */
  symbol?: boolean
  /** Thousands separators (default true). */
  grouping?: boolean
  /** Always show exactly this many decimals instead of the 2-to-6 rule. */
  fixed?: number
  /** Prefix positive values with "+". */
  signed?: boolean
}

/**
 * USDC smallest units → "$1,234.50". Two decimals, extended up to six when the amount has
 * non-zero digits beyond cents ("$0.000125"). Accepts undefined/null → "—".
 */
export function fmtUsd(raw: bigint | undefined | null, opts: FmtUsdOptions = {}): string {
  if (raw === undefined || raw === null) return '—'
  const { symbol = true, grouping = true, fixed, signed = false } = opts
  const neg = raw < 0n
  const abs = neg ? -raw : raw
  let text: string
  if (fixed !== undefined) {
    text = formatUnitsFixed(abs, USDC_DECIMALS, fixed)
  } else {
    const exact = formatUnitsExact(abs, USDC_DECIMALS)
    const [, frac = ''] = exact.split('.')
    text = frac.length <= 2 ? formatUnitsFixed(abs, USDC_DECIMALS, 2) : exact
  }
  const [whole, frac] = text.split('.')
  const body = `${grouping ? group(whole) : whole}${frac !== undefined ? `.${frac}` : ''}`
  const sign = neg ? '-' : signed && raw > 0n ? '+' : ''
  return `${sign}${symbol ? '$' : ''}${body}`
}

/** USDC smallest units → plain decimal string for inputs ("1.5"), no symbol, no grouping. */
export function usdInputValue(raw: bigint): string {
  return formatUnitsExact(raw, USDC_DECIMALS)
}

/** 0x8f3c…a21b style. */
export function shortAddr(addr: string | undefined | null, head = 4, tail = 4): string {
  if (!addr) return '—'
  if (addr.length <= 2 + head + tail + 1) return addr
  return `${addr.slice(0, 2 + head)}…${addr.slice(-tail)}`
}

export function nowSec(): number {
  return Math.floor(Date.now() / 1000)
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`
}

/** Compact duration: "2 d 3 h", "28 min", "45 s". */
export function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return m % 60 ? `${h} h ${m % 60} min` : `${h} h`
  const d = Math.floor(h / 24)
  return h % 24 ? `${d} d ${h % 24} h` : plural(d, 'day')
}

/** "28 min left" / "expired" for a unix-seconds deadline. `now` defaults to the clock. */
export function timeLeft(expiresAt: bigint | number, now: number = nowSec()): string {
  const left = Number(expiresAt) - now
  if (left <= 0) return 'expired'
  return `${fmtDuration(left)} left`
}

/** "just now", "5 min ago", "3 h ago", "2 days ago", then a date. Future times: "in 5 min". */
export function relativeTime(ts: bigint | number, now: number = nowSec()): string {
  const t = Number(ts)
  const diff = now - t
  if (Math.abs(diff) < 30) return 'just now'
  if (diff < 0) return `in ${fmtDuration(-diff)}`
  if (diff < 7 * 86400) return `${fmtDuration(diff)} ago`
  return fmtDate(t)
}

/** "26 Oct 2026, 14:05" in the viewer's locale/time zone. */
export function fmtDate(ts: bigint | number): string {
  return new Date(Number(ts) * 1000).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Agent expiry: 0 = never. */
export function fmtExpiry(expiresAt: bigint | number, now: number = nowSec()): string {
  const e = Number(expiresAt)
  if (e === 0) return 'Never'
  if (e <= now) return `Expired ${fmtDate(e)}`
  return fmtDate(e)
}

export const DAY = 86_400

/** Start (unix seconds) of the current UTC day. */
export function utcDayStart(now: number = nowSec()): number {
  return Math.floor(now / DAY) * DAY
}

/**
 * Effective spentToday. v1 contracts return the stored value even after the UTC day rolled over;
 * v2 returns the effective value. Recomputing here is correct for both.
 */
export function effectiveSpentToday(agent: { spentToday: bigint; dayStart: bigint }, now: number = nowSec()): bigint {
  return Number(agent.dayStart) < utcDayStart(now) ? 0n : agent.spentToday
}

/** Seconds until the daily limit resets (next UTC midnight). */
export function secondsUntilDailyReset(now: number = nowSec()): number {
  return utcDayStart(now) + DAY - now
}
