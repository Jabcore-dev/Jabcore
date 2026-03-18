import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'Produkty',
  description: 'Naše vlastní produkty a nástroje.',
  path: '/products',
})

export default function ProductsPage() {
  return <div>ProductsPage — Honza doplní</div>
}
