/**
 * Main host vs docs host (docs.<domain>) helpers. The proxy (src/proxy.ts) serves the docs at the root
 * of any host starting with "docs."; these helpers let client code build links that work on both.
 * On the server (no window) every helper assumes the main host.
 */

export const DOCS_PREFIX = 'docs.'

export function isDocsHostname(hostname: string): boolean {
  return hostname.toLowerCase().startsWith(DOCS_PREFIX)
}

/** True in the browser when the page is served from docs.<domain>. */
export function isDocsHost(): boolean {
  return typeof window !== 'undefined' && isDocsHostname(window.location.hostname)
}

/** Origin of the main site (same protocol and port, hostname without "docs."). */
export function mainOrigin(): string {
  if (typeof window === 'undefined') return ''
  const { protocol, hostname, port } = window.location
  const host = isDocsHostname(hostname) ? hostname.slice(DOCS_PREFIX.length) : hostname
  return `${protocol}//${host}${port ? `:${port}` : ''}`
}

/** Origin of the docs subdomain. */
export function docsOrigin(): string {
  if (typeof window === 'undefined') return ''
  const { protocol, hostname, port } = window.location
  const host = isDocsHostname(hostname) ? hostname : `${DOCS_PREFIX}${hostname}`
  return `${protocol}//${host}${port ? `:${port}` : ''}`
}

/**
 * Link to a main-site path (e.g. "/app"). On the docs host this is an absolute URL to the main host;
 * on the main host it is the path unchanged.
 */
export function mainHref(path: string): string {
  return isDocsHost() ? `${mainOrigin()}${path}` : path
}

/**
 * Link to a docs page. Always "/docs/<slug>" on the server and the main host; "/<slug>" on the docs
 * host (the proxy also canonicalises /docs/<slug> → /<slug> there, so both work).
 */
export function docsHref(slug?: string, hash?: string): string {
  const h = hash ? `#${hash.replace(/^#/, '')}` : ''
  if (isDocsHost()) return `/${slug ?? ''}${h}`
  return `/docs${slug ? `/${slug}` : ''}${h}`
}
