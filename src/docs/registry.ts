// Server-only module (uses node:fs); import it from server components and route handlers only.
import fs from 'node:fs'
import path from 'node:path'

/**
 * Docs pages live in src/docs/content/<slug>.md with a small frontmatter block:
 *
 *   ---
 *   title: Agent payments
 *   summary: One line shown under the title and in llms.txt.
 *   group: Core concepts
 *   order: 5
 *   meta: Function=agentPay(...) | Caller=An active agent      (optional metadata card)
 *   tags: approval-requests, spending-rules                   (optional related-page chips)
 *   ---
 *
 * A fenced block with the language `include` and the body `skill.md` is replaced by cli/SKILL.md.
 */

export const DOCS_GROUPS = ['Get started', 'Core concepts', 'Security', 'Reference'] as const
export type DocsGroup = (typeof DOCS_GROUPS)[number]

export interface DocPage {
  slug: string
  title: string
  summary: string
  group: DocsGroup
  order: number
  meta: { key: string; value: string }[]
  tags: string[]
  /** Markdown body with frontmatter removed and includes expanded. */
  body: string
}

const CONTENT_DIR = path.join(process.cwd(), 'src', 'docs', 'content')
const SKILL_PATH = path.join(process.cwd(), 'cli', 'SKILL.md')

function parseFrontmatter(raw: string, slug: string): { data: Record<string, string>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw)
  if (!match) throw new Error(`docs/${slug}.md: missing frontmatter`)
  const data: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    data[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }
  return { data, body: raw.slice(match[0].length) }
}

export function readSkillMd(): string {
  return fs.readFileSync(SKILL_PATH, 'utf8')
}

/** Replaces ```include\nskill.md\n``` with the SKILL.md source in a markdown fence. */
export function expandIncludes(body: string): string {
  return body.replace(/```include\n\s*skill\.md\s*\n```/g, () => '````markdown title="SKILL.md"\n' + readSkillMd().trimEnd() + '\n````')
}

let cache: DocPage[] | undefined

export function getAllDocs(): DocPage[] {
  if (cache) return cache
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'))
  const pages = files.map((file): DocPage => {
    const slug = file.replace(/\.md$/, '')
    const { data, body } = parseFrontmatter(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'), slug)
    const group = data.group as DocsGroup
    if (!data.title || !DOCS_GROUPS.includes(group)) throw new Error(`docs/${file}: needs a title and a valid group`)
    return {
      slug,
      title: data.title,
      summary: data.summary ?? '',
      group,
      order: Number(data.order ?? 99),
      meta: (data.meta ?? '')
        .split('|')
        .map((pair) => pair.trim())
        .filter(Boolean)
        .map((pair) => {
          const i = pair.indexOf('=')
          return { key: pair.slice(0, i).trim(), value: pair.slice(i + 1).trim() }
        }),
      tags: (data.tags ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      body,
    }
  })
  pages.sort((a, b) => DOCS_GROUPS.indexOf(a.group) - DOCS_GROUPS.indexOf(b.group) || a.order - b.order)
  cache = pages
  return pages
}

export function getDoc(slug: string): DocPage | undefined {
  return getAllDocs().find((p) => p.slug === slug)
}

/** The page's markdown as served to agents (frontmatter dropped, includes expanded). */
export function docMarkdown(page: DocPage): string {
  return `# ${page.title}\n\n> ${page.summary}\n\n${expandIncludes(page.body).trim()}\n`
}

export function siblings(slug: string): { prev?: DocPage; next?: DocPage } {
  const all = getAllDocs()
  const i = all.findIndex((p) => p.slug === slug)
  return { prev: i > 0 ? all[i - 1] : undefined, next: i >= 0 && i < all.length - 1 ? all[i + 1] : undefined }
}

export interface SearchEntry {
  slug: string
  title: string
  group: string
  summary: string
  headings: string[]
  text: string
}

export function searchIndex(): SearchEntry[] {
  return getAllDocs().map((p) => ({
    slug: p.slug,
    title: p.title,
    group: p.group,
    summary: p.summary,
    headings: [...p.body.matchAll(/^#{2,3} (.+)$/gm)].map((m) => m[1]),
    text: p.body
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[#>*`|[\]()-]/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 4000),
  }))
}
