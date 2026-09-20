import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import '../globals.css'
import RootHtml from '@/components/RootHtml'
import { Toaster } from '@/components/ui/sonner'

/**
 * Shell shared by the panel and its login screen.
 *
 * No I18nProvider: the panel is Czech only. Loading it would pull all twelve
 * locale files into the bundle for an interface that never uses them.
 */
export const metadata: Metadata = {
  title: 'Administrace | Jabcore',
  // Belt and braces next to robots.txt: the panel should never be indexed
  // even if it is linked from somewhere by accident.
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Bez analytiky: za přihlášením není co měřit.
    <RootHtml lang="cs" analytics={false}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background text-foreground">{children}</div>
        <Toaster position="bottom-right" />
      </ThemeProvider>
    </RootHtml>
  )
}
