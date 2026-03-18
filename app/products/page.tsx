import { generatePageMetadata } from '@/lib/metadata'
import ProductsPage from '@/pages/ProductsPage'

export const metadata = generatePageMetadata({
  title: 'Produkty',
  description: 'Naše vlastní produkty a nástroje — Pillse a další.',
  path: '/products',
})

export default ProductsPage
