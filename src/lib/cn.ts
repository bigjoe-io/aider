import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge our custom type utilities so `cn('text-display', 'text-fg')` keeps both.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'h2', 'lead'] }],
    },
  },
})

/** Merge class names (clsx semantics + Tailwind conflict resolution). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
