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
      {/* Reads the database, so it is rendered on the server. It returns null
          when nothing is published yet, and the homepage keeps working if the
          database is down. */}
      <ReferencesPreview locale={locale} />
      <WhyChooseUs />
      <CollaborationProcess />
      <TechStack />
      <CTA />
    </div>
  )
}
