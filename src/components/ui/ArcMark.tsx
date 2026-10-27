import { useId } from 'react'
import { cn } from '@/lib/cn'

/** The Arc logo (gradient arch). */
export function ArcMark({ className, title }: { className?: string; title?: string }) {
  const id = `arc-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn('size-6', className)} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path
        fill={`url(#${id})`}
        d="M3.5 20.999c.146-4.407.893-8.519 2.142-11.717C7.223 5.231 9.513 3 12.088 3s4.865 2.231 6.447 6.283c.822 2.107 1.427 4.61 1.786 7.334q.048.366.087.737.015.024.013.041s.21 1.317.256 3.604h-.024c-.313-.256-4-3.153-10.112-2.314.093-1.035.22-2.04.383-3.005l.027-.146a24.5 24.5 0 0 1 6.104.57q-.007-.056-.017-.115c-.33-2.06-.819-3.945-1.448-5.556-1.029-2.635-2.371-4.271-3.502-4.271-1.132 0-2.474 1.636-3.503 4.271q-.375.958-.679 2.034a30 30 0 0 0-.718 3.213A40 40 0 0 0 6.662 21H3.5z"
      />
      <defs>
        <linearGradient id={id} x1="12.088" x2="12.088" y1="3" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#182680" />
          <stop offset="1" stopColor="#842D56" />
        </linearGradient>
      </defs>
    </svg>
  )
}
