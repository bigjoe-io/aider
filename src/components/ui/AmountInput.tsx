'use client'

import { useId } from 'react'
import { AmountError, parseAmount } from '@/onchain-money'
import { AIDER_CHAIN_ID } from '@/aider/config'
import { cn } from '@/lib/cn'
import { Input, type InputProps } from './Input'

export interface ParsedAmount {
  /** USDC smallest units (6 decimals); undefined when empty or invalid */
  raw: bigint | undefined
  /** user-facing problem, if any */
  error: string | undefined
}

/** Parse a user-typed USD amount ("$1.50", "0.05") into USDC smallest units via '@/onchain-money'. */
export function parseUsdInput(value: string, opts: { max?: bigint; allowZero?: boolean } = {}): ParsedAmount {
  const v = value.trim().replace(/^\$/, '').replace(/,/g, '')
  if (v === '') return { raw: undefined, error: undefined }
  try {
    const raw = parseAmount(AIDER_CHAIN_ID, v).raw
    if (raw < 0n) return { raw: undefined, error: 'Amount can’t be negative' }
    if (raw === 0n && !opts.allowZero) return { raw: undefined, error: 'Enter more than $0' }
    if (opts.max !== undefined && raw > opts.max) return { raw, error: 'More than is available' }
    return { raw, error: undefined }
  } catch (err) {
    if (err instanceof AmountError && err.code === 'TOO_MANY_FRACTION_DIGITS') return { raw: undefined, error: 'At most 6 decimals' }
    return { raw: undefined, error: 'Enter an amount like 1.50' }
  }
}

export interface AmountInputProps extends Omit<InputProps, 'value' | 'onChange' | 'prefix' | 'type' | 'max'> {
  value: string
  onChange: (value: string) => void
  /** Shows a "Max" button that fills this many smallest units. */
  max?: bigint
  onMax?: () => void
}

/** "$" prefixed decimal input. Validate with parseUsdInput(value). */
export function AmountInput({ value, onChange, max, onMax, className, suffix, ...rest }: AmountInputProps) {
  const fallbackId = useId()
  return (
    <Input
      id={rest.id ?? fallbackId}
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      placeholder="0.00"
      prefix="$"
      mono
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,$]/g, ''))}
      className={cn('text-[15px]', className)}
      suffix={
        suffix ??
        (max !== undefined || onMax ? (
          <button
            type="button"
            onClick={onMax}
            className="h-8 rounded-lg px-2.5 text-xs font-medium text-accent hover:bg-accent/10"
          >
            Max
          </button>
        ) : undefined)
      }
      {...rest}
    />
  )
}
