'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'aider-theme'
export const DEFAULT_THEME_MODE: ThemeMode = 'dark'
export const THEME_MODES: readonly ThemeMode[] = ['dark', 'light', 'auto']

/**
 * Inline <head> script (static string, our own code) that applies the stored theme before first paint.
 * Keep in sync with the logic below.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}',m=localStorage.getItem(k);if(m!=='light'&&m!=='dark'&&m!=='auto')m='${DEFAULT_THEME_MODE}';var t=m==='auto'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):m;var d=document.documentElement;d.setAttribute('data-theme',t);d.setAttribute('data-theme-mode',m);d.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

function isMode(v: unknown): v is ThemeMode {
  return v === 'light' || v === 'dark' || v === 'auto'
}

// --- tiny external store for the stored mode -------------------------------------------------
const listeners = new Set<() => void>()

function readMode(): ThemeMode {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isMode(v) ? v : DEFAULT_THEME_MODE
  } catch {
    return DEFAULT_THEME_MODE
  }
}

function writeMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    // storage blocked: theme still applies for this page view
  }
  memoMode = mode
  listeners.forEach((l) => l())
}

let memoMode: ThemeMode | null = null

function subscribeMode(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) {
      memoMode = null
      cb()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

function getModeSnapshot(): ThemeMode {
  if (memoMode === null) memoMode = readMode()
  return memoMode
}

function subscribeSystem(cb: () => void) {
  const mql = window.matchMedia('(prefers-color-scheme: light)')
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

function getSystemSnapshot(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

// --- context ---------------------------------------------------------------------------------
interface ThemeContextValue {
  /** The user's choice. */
  mode: ThemeMode
  /** The theme actually applied (auto resolved against the OS setting). */
  resolved: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  /** dark → light → auto → dark */
  cycle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribeMode, getModeSnapshot, () => DEFAULT_THEME_MODE)
  const system = useSyncExternalStore(subscribeSystem, getSystemSnapshot, () => 'dark' as const)
  const resolved: ResolvedTheme = mode === 'auto' ? system : mode

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', resolved)
    root.setAttribute('data-theme-mode', mode)
    root.style.colorScheme = resolved
  }, [mode, resolved])

  const setMode = useCallback((next: ThemeMode) => writeMode(next), [])
  const cycle = useCallback(() => {
    const current = getModeSnapshot()
    writeMode(THEME_MODES[(THEME_MODES.indexOf(current) + 1) % THEME_MODES.length])
  }, [])

  const value = useMemo(() => ({ mode, resolved, setMode, cycle }), [mode, resolved, setMode, cycle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
