import { readSkillMd } from '@/docs/registry'

export const dynamic = 'force-static'

export function GET() {
  return new Response(readSkillMd(), { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
