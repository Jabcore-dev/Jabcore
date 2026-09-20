import type { Metadata } from 'next'
import '../globals.css'
import RootHtml from '@/components/RootHtml'
import ViewTracker from '@/components/ViewTracker'

/**
 * Root layout of the bare domain - the Czech homepage and its canonical URL.
 * Always Czech, because middleware moves every other language to /<locale>.
 */
export const metadata: Metadata = {
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootHtml lang="cs">
      <ViewTracker />
      {children}
    </RootHtml>
  )
}
