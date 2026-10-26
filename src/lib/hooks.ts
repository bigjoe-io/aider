'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/** False during SSR and the first client render, true after hydration. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

/** Live `window.matchMedia(query).matches`; `false` on the server. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** True once the page has scrolled past `threshold` px. */
export function useScrolled(threshold = 8): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('scroll', cb, { passive: true })
      return () => window.removeEventListener('scroll', cb)
    },
    () => window.scrollY > threshold,
    () => false,
  )
}

/** Current time in seconds, re-rendering every `intervalMs` (for countdowns). 0 on the server. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(0)
  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000))
    const first = window.setTimeout(tick, 0)
    const id = window.setInterval(tick, intervalMs)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [intervalMs])
  return now
}
