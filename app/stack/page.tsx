import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Náš Technologický Stack',
  description: 'Pracujeme s nejmodernějšími technologiemi: React, TypeScript, Node.js, Python, AI integrace, cloud řešení a další.',
  path: '/stack',
})

// TODO Honza: Replace with content from src/pages/StackPage.tsx
export default function StackPage() {
  return (
    <main>
      <p>Stack — TODO Honza</p>
    </main>
  )
}
