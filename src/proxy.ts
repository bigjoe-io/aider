import { NextResponse, type NextRequest } from 'next/server'

/**
 * Serves the docs at the root of any `docs.*` host (docs.localhost:5173 locally, docs.<domain> in
 * production) from the same build that serves the app under `/docs` on the main host.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  if (!host.startsWith('docs.')) return NextResponse.next()

  const url = request.nextUrl.clone()
  const path = url.pathname

  if (path.startsWith('/_next') || path.startsWith('/api/')) return NextResponse.next()

  // Raw markdown of a page for agents: /agent-payments.md
  const md = /^\/([a-z0-9-]+)\.md$/.exec(path)
  if (md && md[1] !== 'skill') {
    url.pathname = `/api/docs-md/${md[1]}`
    return NextResponse.rewrite(url)
  }

  // Other files (llms.txt, skill.md, icon.svg, …) are served as is.
  if (/\.[a-z0-9]+$/i.test(path)) return NextResponse.next()

  // Redirects are built from the Host header so the visitor's hostname (and port) is kept.
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '')
  const search = url.search

  // The app also works here; docs links send people to the main host (see DocsTopBar).
  // (A cross-host redirect is avoided on purpose: Next's dev server rewrites redirects to
  // localhost into relative ones, which would loop on docs.localhost.)
  if (path === '/app' || path.startsWith('/app/')) return NextResponse.next()

  // Canonical docs URLs on this host have no /docs prefix.
  if (path === '/docs' || path.startsWith('/docs/')) {
    return NextResponse.redirect(`${proto}://${host}${path.slice('/docs'.length) || '/'}${search}`, 308)
  }

  url.pathname = path === '/' ? '/docs' : `/docs${path}`
  return NextResponse.rewrite(url)
}

export default proxy

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
