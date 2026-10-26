import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Type checking runs separately with the repo's TypeScript 7 (`bun run typecheck`); Next's built-in
  // checker needs the TypeScript JS API, which TypeScript 7 does not ship.
  typescript: { ignoreBuildErrors: true },
  // Raw markdown of each docs page, for agents (llms.txt links here).
  async rewrites() {
    return [{ source: '/docs/:slug.md', destination: '/api/docs-md/:slug' }]
  },
}

export default nextConfig
