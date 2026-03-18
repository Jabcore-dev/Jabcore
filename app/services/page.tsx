import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Naše Služby',
  description: 'Nabízíme kompletní služby webového vývoje, tvorbu mobilních aplikací, AI integrace, cloud řešení a UX/UI design.',
  path: '/services',
})

// TODO Honza: Replace with content from src/pages/ServicesPage.tsx
// - Wrap in 'use client' (Framer Motion, useTranslation)
export default function ServicesPage() {
  return (
    <main>
      <p>Services — TODO Honza</p>
    </main>
  )
}
