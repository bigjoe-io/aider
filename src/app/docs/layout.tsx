import type { Metadata } from 'next'
import { DOCS_GROUPS, getAllDocs, searchIndex } from '@/docs/registry'
import { DocsSidebar, DocsTopBar, type NavGroup } from '@/components/docs/DocsChrome'
import { SiteFooter } from '@/components/site'

export const metadata: Metadata = {
  title: { default: 'Docs', template: '%s · Aider docs' },
  description: 'How Aider works: USDC wallets for AI agents on Arc, with limits, approvals and an instant kill switch.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pages = getAllDocs()
  const groups: NavGroup[] = DOCS_GROUPS.map((group) => ({
    group,
    pages: pages.filter((p) => p.group === group).map((p) => ({ slug: p.slug, title: p.title, group: p.group })),
  })).filter((g) => g.pages.length > 0)

  return (
    <div id="top" className="min-h-dvh bg-bg">
      <DocsTopBar groups={groups} index={searchIndex()} />
      <div className="mx-auto flex max-w-[1440px] gap-10 px-5 sm:px-8">
        <aside className="sticky top-[113px] hidden h-[calc(100dvh-113px)] w-[248px] shrink-0 overflow-y-auto py-10 pr-2 lg:block">
          <DocsSidebar groups={groups} className="min-h-full" />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <div className="mt-24 px-3 pb-3 sm:px-5 sm:pb-5">
        <SiteFooter />
      </div>
    </div>
  )
}
