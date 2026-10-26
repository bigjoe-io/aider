import type { Metadata } from 'next'
import { Button } from '@/components/ui/Button'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteNav } from '@/components/site/SiteNav'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main id="main" className="container-x">
        <section className="glow-hero noise relative mt-2 flex min-h-[56vh] flex-col justify-end overflow-hidden rounded-[28px] border border-line p-8 sm:p-12 lg:p-14">
          <div className="relative z-[1] max-w-2xl">
            <p className="label">404</p>
            <h1 className="text-display mt-4">This page flew off.</h1>
            <p className="text-lead mt-5 max-w-xl">
              The link may be old or mistyped. The app, the docs and the home page are all still where you left them.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button href="/" size="lg">
                Back home
              </Button>
              <Button href="/docs" variant="link" size="lg">
                Read the docs
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
