import { generatePageMetadata } from '@/lib/metadata'
import StackPage from '@/pages/StackPage'

export const metadata = generatePageMetadata({
  title: 'Technologie',
  description: 'Technologie a nástroje, které používáme — Vue, React, Next.js, Node.js, .NET, Kubernetes a další.',
  path: '/stack',
})

export default StackPage
