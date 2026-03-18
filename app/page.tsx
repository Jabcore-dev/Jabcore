import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Jabcore',
  description: 'Jabcore nabízí profesionální webový vývoj, moderní digitální řešení a konzultace. Specializujeme se na React, TypeScript a moderní technologie.',
  path: '/',
})

// TODO Honza: Replace this placeholder with the content from src/pages/HomePage.tsx
// - Import and render all sections: Hero, ServicesPreview, CollaborationPreview, CollaborationProcess, WhyChooseUs, TechStack, CTA
// - Wrap in 'use client' if needed (Framer Motion, hooks)
export default function HomePage() {
  return (
    <main>
      <p>Homepage — TODO Honza</p>
    </main>
  )
}
