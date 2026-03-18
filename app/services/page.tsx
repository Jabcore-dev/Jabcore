import { generatePageMetadata } from '@/lib/metadata'
import ServicesPage from '@/pages/ServicesPage'

export const metadata = generatePageMetadata({
  title: 'Služby',
  description: 'Vyvíjíme mobilní aplikace, enterprise systémy a webové aplikace na míru. Prozkoumejte naše služby.',
  path: '/services',
})

export default ServicesPage
