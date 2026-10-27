import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import { AIDER_NETWORKS, NETWORKS, type AiderNetwork, type NetworkConfig } from '@/aider/config'
import { Callout, CodeBlock, Table, TBody, TD, TH, THead, TR } from '@/components/ui'
import type { CalloutTone } from '@/components/ui'

/**
 * Renders the docs' markdown subset to React elements (server-safe, no raw HTML):
 * ## / ### headings, paragraphs, - and 1. lists (one nesting level), fenced code with an optional
 * title="…", GFM tables, > [!NOTE] / [!TIP] / [!WARNING] callouts, > quotes, --- rules, and inline
 * `code`, **bold**, *italic*, [text](url).
 *
 * Network-aware content: a block between `:::testnet` and `:::` (or `:::mainnet`) only shows on that
 * network, and `{{name}}` placeholders (see networkVars) are filled in per network. Both variants are
 * rendered and CSS shows the one for <html data-network>, so pages stay static.
 */

/** Placeholders docs can use as {{name}}. */
export function networkVars(net: NetworkConfig): Record<string, string> {
  const contract = net.contract ?? (net.isTestnet ? '0x…' : '<mainnet contract, not deployed yet>')
  const setupFlags = net.isTestnet
    ? net.isDefaultDeployment
      ? ''
      : ` --contract ${contract}`
    : ` --network mainnet --contract ${contract}`
  return {
    network: net.label,
    chain: net.displayName,
    chainId: String(net.chainId),
    explorer: net.explorerBase,
    contract,
    setupFlags,
    networkFlag: net.isTestnet ? '' : ' --network mainnet',
    // Fixed values, the same on every network.
    mainnetContract: NETWORKS.mainnet.contract ?? 'Not deployed yet',
  }
}

const VAR = /\{\{(\w+)\}\}/g

function fill(text: string, vars: Record<string, string>): string {
  return text.replace(VAR, (m, k: string) => vars[k] ?? m)
}

function hasVars(value: unknown): boolean {
  return JSON.stringify(value).includes('{{')
}

/** Deep-copies a parsed block with every string passed through `f`. */
function mapStrings<T>(value: T, f: (s: string) => string): T {
  if (typeof value === 'string') return f(value) as T
  if (Array.isArray(value)) return value.map((v: unknown) => mapStrings(v, f)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, f)])) as T
  }
  return value
}

const NET_OPEN = /^:::(testnet|mainnet)(-undeployed)?\s*$/

/** `:::mainnet-undeployed` blocks only exist while that network has no Aider contract. */
function keepNetBlock(m: RegExpExecArray): boolean {
  return !m[2] || !NETWORKS[m[1] as AiderNetwork].contract
}

/** The markdown as it reads on one network: other networks' blocks removed, placeholders filled. */
export function applyNetwork(md: string, network: AiderNetwork): string {
  const out: string[] = []
  let inside: AiderNetwork | 'skip' | null = null
  for (const line of md.replace(/\r\n/g, '\n').split('\n')) {
    const open = NET_OPEN.exec(line.trim())
    if (open) {
      inside = keepNetBlock(open) ? (open[1] as AiderNetwork) : 'skip'
      continue
    }
    if (inside && line.trim() === ':::') {
      inside = null
      continue
    }
    if (inside && inside !== network) continue
    out.push(line)
  }
  return fill(out.join('\n'), networkVars(NETWORKS[network]))
}

/** Text with {{placeholders}}, shown for the visitor's network. */
export function NetText({ text }: { text: string }): ReactNode {
  if (!text.includes('{{')) return text
  return (
    <>
      {AIDER_NETWORKS.map((n) => (
        <span key={n} data-net={n}>
          {fill(text, networkVars(NETWORKS[n]))}
        </span>
      ))}
    </>
  )
}

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Only http(s), mailto, site-relative and in-page links survive; anything else is dropped. */
export function safeHref(href: string): string | undefined {
  const h = href.trim()
  if (/^https?:\/\//i.test(h) || /^mailto:/i.test(h)) return h
  if (h.startsWith('/') && !h.startsWith('//')) return h
  if (h.startsWith('#')) return h
  return undefined
}

// ---------------------------------------------------------------------------------------------
// Inline
// ---------------------------------------------------------------------------------------------

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)\s]+\))/

export function renderInline(text: string, keyPrefix = 'i'): ReactNode[] {
  const out: ReactNode[] = []
  let rest = text
  let n = 0
  while (rest.length > 0) {
    const m = INLINE.exec(rest)
    if (!m) {
      out.push(rest)
      break
    }
    if (m.index > 0) out.push(rest.slice(0, m.index))
    const token = m[0]
    const key = `${keyPrefix}-${n++}`
    if (m[1]) {
      out.push(
        <code key={key} className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.86em] text-fg">
          {token.slice(1, -1)}
        </code>,
      )
    } else if (m[2]) {
      out.push(
        <strong key={key} className="font-medium text-fg">
          {renderInline(token.slice(2, -2), key)}
        </strong>,
      )
    } else if (m[3]) {
      out.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>)
    } else {
      const lm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token)
      const label = lm ? lm[1] : token
      const href = lm ? safeHref(lm[2]) : undefined
      const cls = 'text-fg underline decoration-fg-3/60 underline-offset-[3px] transition-colors hover:decoration-accent'
      if (!href) out.push(<span key={key}>{renderInline(label, key)}</span>)
      else if (/^https?:/i.test(href) || href.startsWith('mailto:'))
        out.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
            {renderInline(label, key)}
          </a>,
        )
      else
        out.push(
          <Link key={key} href={href} className={cls}>
            {renderInline(label, key)}
          </Link>,
        )
    }
    rest = rest.slice(m.index + token.length)
  }
  return out
}

/** Plain text of inline markdown (for headings in the TOC and slugs). */
export function inlineText(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

// ---------------------------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------------------------

type ListItem = { text: string; children: { ordered: boolean; items: string[] } | null }

type Block =
  | { kind: 'heading'; level: 2 | 3; text: string; id: string }
  | { kind: 'para'; text: string }
  | { kind: 'code'; lang?: string; title?: string; code: string }
  | { kind: 'list'; ordered: boolean; items: ListItem[] }
  | { kind: 'table'; head: string[]; rows: string[][]; align: ('left' | 'right' | 'center' | undefined)[] }
  | { kind: 'callout'; tone: CalloutTone; text: string[] }
  | { kind: 'quote'; text: string[] }
  | { kind: 'hr' }
  | { kind: 'net'; network: AiderNetwork; blocks: Block[] }

function splitRow(line: string): string[] {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  // Split on pipes that aren't inside `code`.
  const cells: string[] = []
  let cur = ''
  let inCode = false
  for (const ch of s) {
    if (ch === '`') inCode = !inCode
    if (ch === '|' && !inCode) {
      cells.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  cells.push(cur.trim())
  return cells
}

const CALLOUTS: Record<string, CalloutTone> = { NOTE: 'note', TIP: 'tip', WARNING: 'warning', CAUTION: 'warning', IMPORTANT: 'note' }

export function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  const used = new Map<string, number>()
  const uniqueId = (text: string) => {
    const base = slugify(inlineText(text)) || 'section'
    const count = used.get(base) ?? 0
    used.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    const net = NET_OPEN.exec(line.trim())
    if (net) {
      const inner: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== ':::') inner.push(lines[i++])
      i++
      if (keepNetBlock(net)) blocks.push({ kind: 'net', network: net[1] as AiderNetwork, blocks: parseBlocks(inner.join('\n')) })
      continue
    }

    const fence = /^(`{3,})\s*([\w-]*)\s*(?:title="([^"]*)")?\s*$/.exec(line)
    if (fence) {
      const close = fence[1]
      const body: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith(close)) body.push(lines[i++])
      i++
      blocks.push({ kind: 'code', lang: fence[2] || undefined, title: fence[3], code: body.join('\n') })
      continue
    }

    const h = /^(#{2,3})\s+(.+)$/.exec(line)
    if (h) {
      const level = h[1].length as 2 | 3
      blocks.push({ kind: 'heading', level, text: h[2].trim(), id: uniqueId(h[2].trim()) })
      i++
      continue
    }

    if (/^-{3,}\s*$/.test(line)) {
      blocks.push({ kind: 'hr' })
      i++
      continue
    }

    if (line.startsWith('>')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) quote.push(lines[i++].replace(/^>\s?/, ''))
      const marker = /^\[!(\w+)\]\s*$/.exec(quote[0] ?? '')
      if (marker && CALLOUTS[marker[1].toUpperCase()]) {
        blocks.push({ kind: 'callout', tone: CALLOUTS[marker[1].toUpperCase()], text: joinParagraphs(quote.slice(1)) })
      } else blocks.push({ kind: 'quote', text: joinParagraphs(quote) })
      continue
    }

    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const head = splitRow(line)
      const align = splitRow(lines[i + 1]).map((c) =>
        c.startsWith(':') && c.endsWith(':') ? ('center' as const) : c.endsWith(':') ? ('right' as const) : undefined,
      )
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]))
      blocks.push({ kind: 'table', head, rows, align })
      continue
    }

    const listStart = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(line)
    if (listStart && listStart[1].length === 0) {
      const ordered = /\d/.test(listStart[2])
      const items: ListItem[] = []
      while (i < lines.length) {
        const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i])
        if (m && m[1].length === 0) {
          items.push({ text: m[3], children: null })
          i++
        } else if (m && m[1].length >= 2 && items.length > 0) {
          const last = items[items.length - 1]
          if (!last.children) last.children = { ordered: /\d/.test(m[2]), items: [] }
          last.children.items.push(m[3])
          i++
        } else if (lines[i].trim() !== '' && /^\s{2,}\S/.test(lines[i]) && items.length > 0) {
          items[items.length - 1].text += ' ' + lines[i].trim()
          i++
        } else break
      }
      blocks.push({ kind: 'list', ordered, items })
      continue
    }

    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{2,3})\s/.test(lines[i]) &&
      !/^`{3,}/.test(lines[i]) &&
      !lines[i].startsWith('>') &&
      !lines[i].startsWith(':::') &&
      !/^([-*]|\d+\.)\s/.test(lines[i]) &&
      !(lines[i].trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1]))
    )
      para.push(lines[i++].trim())
    blocks.push({ kind: 'para', text: para.join(' ') })
  }
  return blocks
}

function joinParagraphs(lines: string[]): string[] {
  const out: string[] = []
  let cur: string[] = []
  for (const l of lines) {
    if (l.trim() === '') {
      if (cur.length) out.push(cur.join(' '))
      cur = []
    } else cur.push(l.trim())
  }
  if (cur.length) out.push(cur.join(' '))
  return out
}

export function toc(md: string): TocItem[] {
  return parseBlocks(md)
    .filter((b): b is Extract<Block, { kind: 'heading' }> => b.kind === 'heading')
    .map((b) => ({ id: b.id, text: inlineText(b.text), level: b.level }))
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source)
  return <div className="docs-prose">{blocks.map((b, i) => renderNetBlock(b, `b${i}`))}</div>
}

/** Renders a block per network when it is network-specific or uses {{placeholders}}. */
function renderNetBlock(b: Block, key: string, only?: NetworkConfig): ReactNode {
  if (b.kind === 'net') {
    return (
      <div key={key} data-net={b.network}>
        {b.blocks.map((c, i) => renderNetBlock(c, `${key}-${i}`, NETWORKS[b.network]))}
      </div>
    )
  }
  if (!hasVars(b)) return renderBlock(b, key)
  if (only) return renderBlock(mapStrings(b, (s) => fill(s, networkVars(only))), key)
  return (
    <Fragment key={key}>
      {AIDER_NETWORKS.map((n) => (
        <div key={n} data-net={n}>
          {renderBlock(mapStrings(b, (s) => fill(s, networkVars(NETWORKS[n]))), `${key}-${n}`)}
        </div>
      ))}
    </Fragment>
  )
}

function renderBlock(b: Block, key: string): ReactNode {
  switch (b.kind) {
    case 'net':
      return renderNetBlock(b, key)
    case 'heading':
      return b.level === 2 ? (
        <h2 key={key} id={b.id} className="mt-14 scroll-mt-28 text-[28px] font-normal leading-tight tracking-[-0.02em] text-fg first:mt-0">
          <a href={`#${b.id}`} className="group">
            {renderInline(b.text, key)}
          </a>
        </h2>
      ) : (
        <h3 key={key} id={b.id} className="mt-10 scroll-mt-28 text-xl font-normal tracking-[-0.01em] text-fg">
          <a href={`#${b.id}`}>{renderInline(b.text, key)}</a>
        </h3>
      )
    case 'para':
      return (
        <p key={key} className="mt-5 text-base leading-[1.75] text-fg-2">
          {renderInline(b.text, key)}
        </p>
      )
    case 'code':
      return <CodeBlock key={key} className="mt-6" code={b.code} lang={b.lang} title={b.title} />
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul'
      return (
        <Tag
          key={key}
          className={`mt-5 space-y-2.5 pl-6 text-base leading-[1.7] text-fg-2 marker:text-fg-3 ${b.ordered ? 'list-decimal' : 'list-disc'}`}
        >
          {b.items.map((it, j) => (
            <li key={j} className="pl-1">
              {renderInline(it.text, `${key}-${j}`)}
              {it.children && (
                <ul className={`mt-2 space-y-2 pl-5 ${it.children.ordered ? 'list-decimal' : 'list-[circle]'}`}>
                  {it.children.items.map((c, k) => (
                    <li key={k} className="pl-1">
                      {renderInline(c, `${key}-${j}-${k}`)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </Tag>
      )
    }
    case 'table':
      return (
        <Table key={key} wrapperClassName="mt-6">
          <THead>
            <TR>
              {b.head.map((h, j) => (
                <TH key={j} style={{ textAlign: b.align[j] }}>
                  {renderInline(h, `${key}-h${j}`)}
                </TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {b.rows.map((r, j) => (
              <TR key={j}>
                {r.map((c, k) => (
                  <TD key={k} style={{ textAlign: b.align[k] }}>
                    {renderInline(c, `${key}-${j}-${k}`)}
                  </TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
      )
    case 'callout':
      return (
        <Callout key={key} tone={b.tone} className="mt-6">
          {b.text.map((t, j) => (
            <p key={j}>{renderInline(t, `${key}-${j}`)}</p>
          ))}
        </Callout>
      )
    case 'quote':
      return (
        <blockquote key={key} className="mt-6 border-l-2 border-line-strong pl-4 text-fg-2">
          {b.text.map((t, j) => (
            <p key={j} className="mt-2 first:mt-0">
              {renderInline(t, `${key}-${j}`)}
            </p>
          ))}
        </blockquote>
      )
    case 'hr':
      return <hr key={key} className="my-10 border-line" />
  }
}
