import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'Technologie',
  description: 'Technologie a nástroje, které používáme při vývoji.',
  path: '/stack',
})

export default function StackPage() {
  return <div>StackPage — Honza doplní</div>
}
