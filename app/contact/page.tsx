import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'Kontakt',
  description: 'Kontaktujte nás — rádi si popovídáme o vašem projektu.',
  path: '/contact',
})

export default function ContactPage() {
  return <div>ContactPage — Honza doplní</div>
}
