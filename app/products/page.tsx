import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Naše Produkty',
  description: 'Objevte naše vlastní produkty a aplikace. PillSee a další inovativní řešení vytvořená týmem Jabcore.',
  path: '/products',
})

// TODO Honza: Replace with content from src/pages/ProductsPage.tsx
export default function ProductsPage() {
  return (
    <main>
      <p>Products — TODO Honza</p>
    </main>
  )
}
