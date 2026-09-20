import type { Metadata } from 'next'
import '../globals.css'
import RootHtml from '@/components/RootHtml'

/**
 * Korenovy layout pro adresy, ktere nespadaji pod zadny jazyk.
 *
 * Zadna stranka tu nezije: "/" presmerovava middleware na /<jazyk>, takze
 * jediny obsah, ktery sem doputuje, je globalni 404. Existuje proto, ze Next
 * pro ni potrebuje layout s <html> a <body>.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function FallbackLayout({ children }: { children: React.ReactNode }) {
  return <RootHtml lang="cs" analytics={false}>{children}</RootHtml>
}
