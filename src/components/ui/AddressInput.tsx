'use client'

import { getAddress, isAddress, type Address } from 'viem'
import { Input, type InputProps } from './Input'

/** Validate a typed address. Returns the checksummed address or an error message. */
export function parseAddressInput(value: string): { address: Address | undefined; error: string | undefined } {
  const v = value.trim()
  if (v === '') return { address: undefined, error: undefined }
  if (!isAddress(v, { strict: false })) return { address: undefined, error: 'Not a valid 0x address' }
  return { address: getAddress(v), error: undefined }
}

export interface AddressInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  value: string
  onChange: (value: string) => void
}

/** Monospace 0x… input. Validate with parseAddressInput(value). */
export function AddressInput({ value, onChange, ...rest }: AddressInputProps) {
  return (
    <Input
      mono
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      placeholder="0x…"
      value={value}
      onChange={(e) => onChange(e.target.value.trim())}
      {...rest}
    />
  )
}
