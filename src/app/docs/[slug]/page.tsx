import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { docMarkdown, expandIncludes, getAllDocs, getDoc, siblings } from '@/docs/registry'
import { Markdown, NetText, toc } from '@/docs/markdown'
import { CopyPageButton, DocLink, Toc } from '@/components/docs/DocsChrome'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllDocs().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = getDoc(slug)
  return page ? { title: page.title, description: page.summary } : {}
}

export default async function DocPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = getDoc(slug)
  if (!page) notFound()

  const body = expandIncludes(page.body)
  const items = toc(body)
  const { prev, next } = siblings(slug)
  const titles = new Map(getAllDocs().map((p) => [p.slug, p.title]))

  return (
    <div className="flex gap-12">
      <article className="min-w-0 max-w-[780px] flex-1 py-10 lg:py-12">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-accent">{page.group}</p>
          <CopyPageButton markdown={{ testnet: docMarkdown(page, 'testnet'), mainnet: docMarkdown(page, 'mainnet') }} />
        </div>
        <h1 className="mt-3 text-[clamp(2rem,4vw,2.75rem)] font-normal leading-[1.1] tracking-[-0.03em] text-fg">{page.title}</h1>
        {page.summary && <p className="mt-4 text-lg leading-relaxed text-fg-2">{page.summary}</p>}

        {page.meta.length > 0 && (
          <dl className="mt-8 grid gap-x-6 gap-y-5 rounded-[20px] border border-line bg-surface p-6 sm:grid-cols-2 lg:grid-cols-4">
            {page.meta.map((m) => (
              <div key={m.key} className="min-w-0">
                <dt className="label">{m.key}</dt>
                <dd className="mt-1.5 break-words text-[15px] text-fg">
                  <NetText text={m.value} />
                </dd>
              </div>
            ))}
          </dl>
        )}

        {page.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {page.tags.filter((t) => titles.has(t)).map((t) => (
              <DocLink key={t} slug={t} className="rounded-full border border-line px-3.5 py-1.5 text-sm text-fg-2 transition-colors hover:border-line-strong hover:text-fg">
                {titles.get(t)}
              </DocLink>
            ))}
          </div>
        )}

        <div className="mt-12">
          <Markdown source={body} />
        </div>

        <nav aria-label="Previous and next pages" className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
          {prev ? (
            <DocLink slug={prev.slug} className="group rounded-[20px] border border-line p-5 transition-colors hover:border-line-strong">
              <span className="flex items-center gap-1.5 text-sm text-fg-3">
                <ArrowLeft className="size-3.5" /> Previous
              </span>
              <span className="mt-1.5 block text-fg">{prev.title}</span>
            </DocLink>
          ) : (
            <span />
          )}
          {next && (
            <DocLink slug={next.slug} className="group rounded-[20px] border border-line p-5 text-right transition-colors hover:border-line-strong">
              <span className="flex items-center justify-end gap-1.5 text-sm text-fg-3">
                Next <ArrowRight className="size-3.5" />
              </span>
              <span className="mt-1.5 block text-fg">{next.title}</span>
            </DocLink>
          )}
        </nav>
      </article>
      <aside className="sticky top-[113px] hidden h-fit w-[230px] shrink-0 py-12 xl:block">
        <Toc items={items} />
      </aside>
    </div>
  )
}
