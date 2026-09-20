import Link from 'next/link'
import { FileText, Inbox, Users, Eye } from 'lucide-react'
import { getStats, listMessages } from '@/lib/admin-data'
import { requireSession } from '@/lib/auth/guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const session = await requireSession()
  const [stats, recent] = await Promise.all([getStats(), listMessages()])

  const tiles = [
    { label: 'Reference', value: stats.references, hint: `${stats.published} publikovaných`, icon: FileText, href: '/admin/reference' },
    { label: 'Poptávky', value: stats.messages, hint: `${stats.unread} nových`, icon: Inbox, href: '/admin/kontakty' },
    { label: 'Uživatelé', value: stats.users, hint: 's přístupem do adminu', icon: Users, href: '/admin/uzivatele' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Dobrý den, {session.name ?? session.email}
        </h1>
        <p className="text-sm text-muted-foreground">Přehled obsahu a poptávek.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles
          .filter((tile) => tile.href !== '/admin/uzivatele' || session.role === 'owner')
          .map((tile) => {
            const Icon = tile.icon
            return (
              <Link key={tile.label} href={tile.href}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {tile.label}
                    </CardTitle>
                    <Icon className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{tile.value}</div>
                    <p className="text-xs text-muted-foreground">{tile.hint}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Poslední poptávky</CardTitle>
          <Link href="/admin/kontakty" className="text-sm text-muted-foreground hover:text-foreground">
            Všechny →
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Zatím žádné zprávy.</p>
          ) : (
            <ul className="divide-y divide-border">
              {/* Five is what fits without the dashboard turning into the
                  inbox it links to. */}
              {recent.slice(0, 5).map((message) => (
                <li key={message.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{message.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{message.message}</p>
                  </div>
                  {message.status === 'new' && <Badge>Nová</Badge>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="size-4" />
            Kde se obsah zobrazuje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            Publikované reference se objeví na <strong>jabcore.cz/cs/reference</strong>, na
            homepage a na <strong>portfolio.jabcore.cz</strong>.
          </p>
          <p>Změny se projeví hned po uložení — cache se sama zneplatní.</p>
        </CardContent>
      </Card>
    </div>
  )
}
