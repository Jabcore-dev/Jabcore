import { Suspense } from 'react'
import Hero from '@/components/sections/Hero'
import CollaborationProcess from '@/components/sections/CollaborationProcess'
import ServicesPreview from '@/components/sections/ServicesPreview'
import ReferencesPreview from '@/components/references/ReferencesPreview'
import WhyChooseUs from '@/components/sections/WhyChooseUs'
import TechStack from '@/components/sections/TechStack'
import CTA from '@/components/sections/CTA'
import type { Locale } from '@/lib/i18n-config'

export default function HomePage({ locale }: { locale: Locale }) {
  return (
    <div>
      <Hero />
      <ServicesPreview />
      {/*
        Wrapped in Suspense so the database read does not hold up the rest of
        the page: everything around it is prerendered and served from the
        cache, and only this section is streamed in per request. Without it the
        whole homepage becomes dynamic and every visitor waits for Postgres
        before seeing anything.

        No fallback markup on purpose — the section renders nothing at all when
        there is nothing published, so a placeholder would be a box that
        sometimes collapses to zero height after loading.
      */}
      <Suspense fallback={null}>
        <ReferencesPreview locale={locale} />
      </Suspense>
      <WhyChooseUs />
      <CollaborationProcess />
      <TechStack />
      <CTA />
    </div>
  )
}
