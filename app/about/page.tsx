import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'O nás',
  description: 'Poznejte tým Jabcore — lean tým vývojářů s AI-first přístupem.',
  path: '/about',
})

export default function AboutPage() {
  return <div>AboutPage — Honza doplní</div>
}
