import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'Služby',
  description: 'Vyvíjíme mobilní aplikace, enterprise systémy a webové aplikace na míru.',
  path: '/services',
})

export default function ServicesPage() {
  return <div>ServicesPage — Honza doplní</div>
}
