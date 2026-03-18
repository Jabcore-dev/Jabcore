import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'Jabcore — Build it right, build it once.',
  description: 'Vývoj softwaru na míru — mobilní aplikace, enterprise systémy, webové aplikace.',
  path: '/',
  isHome: true,
})

export default function HomePage() {
  return <div>Homepage — Honza doplní</div>
}
