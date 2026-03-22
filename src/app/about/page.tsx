import { generatePageMetadata } from '@/lib/metadata'
import AboutPage from '@/views/AboutPage'

export const metadata = generatePageMetadata({
  title: 'O nás',
  description: 'Poznejte tým Jabcore — lean tým vývojářů s AI-first přístupem. Build it right, build it once.',
  path: '/about',
})

export default AboutPage
