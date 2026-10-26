import { SiteFooter, SiteNav } from '@/components/site'
import { LiveStats } from '@/components/landing/Interactive'
import {
  ApprovalsSection,
  BuiltOn,
  Comparison,
  Developers,
  Faq,
  FeatureRows,
  Hero,
  LivePanel,
  ProductColumns,
  Statement,
  UseCases,
} from '@/components/landing/Sections'

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />
        <BuiltOn />
        <ProductColumns />
        <div className="py-12">
          <LiveStats />
        </div>
        <Statement />
        <LivePanel />
        <Comparison />
        <UseCases />
        <ApprovalsSection />
        <Developers />
        <FeatureRows />
        <Faq />
      </main>
      <div className="px-3 pb-3 sm:px-5 sm:pb-5">
        <SiteFooter />
      </div>
    </>
  )
}
