import { docMarkdown, getAllDocs } from '@/docs/registry'

export const dynamic = 'force-static'

export function GET() {
  const text = getAllDocs()
    .map((p) => `Source: /docs/${p.slug}\n\n${docMarkdown(p)}`)
    .join('\n\n---\n\n')
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
