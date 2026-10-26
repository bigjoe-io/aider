import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { CopyButton } from './CopyButton'
import { highlight, normalizeLang } from './highlight'

const LANG_LABEL: Record<string, string> = { bash: 'Terminal', ts: 'TypeScript', solidity: 'Solidity', json: 'JSON', markdown: 'Markdown' }

export interface CodeBlockProps {
  code: string
  lang?: string
  /** Header label (file name or "Terminal"); defaults to a language name. */
  title?: ReactNode
  /** Hide the header row (copy button floats top-right instead). */
  bare?: boolean
  /** Extra header content (left of the copy button), e.g. tabs. */
  headerRight?: ReactNode
  copy?: boolean
  /** Wrap long lines instead of scrolling horizontally. */
  wrap?: boolean
  className?: string
  preClassName?: string
}

/**
 * Dark code panel (dark in both themes) with header + copy. Server-component safe; only the copy
 * button is a client island. Content is highlighted into React nodes, never raw HTML.
 */
export function CodeBlock({ code, lang, title, bare, headerRight, copy = true, wrap, className, preClassName }: CodeBlockProps) {
  const text = code.replace(/\n+$/, '')
  const key = normalizeLang(lang)
  const label = title ?? (key ? LANG_LABEL[key] : lang)
  return (
    <div className={cn('theme-dark group/code relative overflow-hidden rounded-2xl border border-line bg-inset text-fg', className)}>
      {!bare && (
        <div className="flex h-11 items-center justify-between gap-3 border-b border-line pl-4 pr-1.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden className="flex gap-1.5">
              <span className="size-2 rounded-full bg-fg/15" />
              <span className="size-2 rounded-full bg-fg/15" />
              <span className="size-2 rounded-full bg-fg/15" />
            </span>
            {label && <span className="truncate font-mono text-xs text-fg-3">{label}</span>}
          </div>
          <div className="flex items-center gap-1">
            {headerRight}
            {copy && <CopyButton value={text} ariaLabel="Copy code" />}
          </div>
        </div>
      )}
      {bare && copy && (
        <div className="absolute right-1.5 top-1.5 z-10 opacity-70 transition-opacity group-hover/code:opacity-100">
          <CopyButton value={text} ariaLabel="Copy code" />
        </div>
      )}
      <pre
        className={cn(
          'overflow-x-auto p-4 font-mono text-[13px] leading-[1.7] text-fg/90 sm:p-5',
          wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
          bare && copy && 'pr-12',
          preClassName,
        )}
      >
        <code>{highlight(text, lang)}</code>
      </pre>
    </div>
  )
}
