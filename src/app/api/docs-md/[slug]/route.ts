import { docMarkdown, getAllDocs, getDoc } from '@/docs/registry'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return getAllDocs().map((p) => ({ slug: p.slug }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = getDoc(slug)
  if (!page) return new Response('Not found\n', { status: 404 })
  return new Response(docMarkdown(page), { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
