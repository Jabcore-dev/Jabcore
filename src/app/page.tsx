import { generatePageMetadata } from '@/lib/metadata'
import { buildOrganizationJsonLd } from '@/lib/jsonld'
import HomePage from '@/views/HomePage'

export const metadata = generatePageMetadata({
  title: 'Jabcore — Build it right, build it once.',
  description: 'Vývoj softwaru na míru — mobilní aplikace, enterprise systémy, webové aplikace. Lean tým, AI-first přístup, konkurenční ceny.',
  path: '/',
  isHome: true,
})

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
      />
      <HomePage />
    </>
  )
}
