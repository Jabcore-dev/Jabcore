import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Kontakt',
  description: 'Kontaktujte nás pro nezávaznou konzultaci vašeho projektu. Rádi vám pomůžeme s webovým vývojem, mobilními aplikacemi nebo AI řešeními.',
  path: '/contact',
})

// TODO Honza: Replace with content from src/pages/ContactPage.tsx
// Note: Contact form uses react-hook-form + zod — keep as 'use client'
export default function ContactPage() {
  return (
    <main>
      <p>Contact — TODO Honza</p>
    </main>
  )
}
