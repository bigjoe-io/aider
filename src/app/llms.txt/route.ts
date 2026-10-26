import { DOCS_GROUPS, getAllDocs } from '@/docs/registry'

export const dynamic = 'force-static'

export function GET() {
  const pages = getAllDocs()
  const sections = DOCS_GROUPS.map((group) => {
    const lines = pages.filter((p) => p.group === group).map((p) => `- [${p.title}](/docs/${p.slug}.md): ${p.summary}`)
    return lines.length ? `## ${group}\n\n${lines.join('\n')}` : ''
  }).filter(Boolean)
  const text = [
    '# Aider',
    '',
    '> A USDC wallet for AI agents on Arc. The owner keeps the funds in the Aider contract; each agent gets its own key with a per-payment limit, a daily limit and an expiry. Payments inside the limits go through at once, bigger ones become approval requests, and the owner can revoke an agent or pause the wallet instantly.',
    '',
    'Agents use the `aidr` command-line tool. Agent instructions: [/skill.md](/skill.md). Every page in one file: [/llms-full.txt](/llms-full.txt).',
    '',
    ...sections.flatMap((s) => [s, '']),
  ].join('\n')
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
