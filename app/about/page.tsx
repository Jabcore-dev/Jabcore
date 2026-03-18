import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'O nás',
  description: 'Poznejte tým Jabcore. Jsme skupina nadšených vývojářů a designérů, kteří vytváří moderní digitální řešení.',
  path: '/about',
})

// TODO Honza: Replace with content from src/pages/AboutPage.tsx
export default function AboutPage() {
  return (
    <main>
      <p>About — TODO Honza</p>
    </main>
  )
}
