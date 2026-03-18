import { generatePageMetadata } from '@/lib/metadata'
import HomePage from '@/pages/HomePage'

export const metadata = generatePageMetadata({
  title: 'Jabcore — Build it right, build it once.',
  description: 'Vývoj softwaru na míru — mobilní aplikace, enterprise systémy, webové aplikace. Lean tým, AI-first přístup, konkurenční ceny.',
  path: '/',
  isHome: true,
})

export default HomePage
