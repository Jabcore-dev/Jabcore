import Hero from '@/components/sections/Hero'
import CollaborationProcess from '@/components/sections/CollaborationProcess'
import ServicesPreview from '@/components/sections/ServicesPreview'
import WhyChooseUs from '@/components/sections/WhyChooseUs'
import TechStack from '@/components/sections/TechStack'
import CTA from '@/components/sections/CTA'

export default function HomePage() {
  return (
    <div>
      <Hero />
      <ServicesPreview />
      <WhyChooseUs />
      <CollaborationProcess />
      <TechStack />
      <CTA />
    </div>
  )
}
