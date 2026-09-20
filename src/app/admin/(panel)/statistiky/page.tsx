import Link from 'next/link'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { getViewStats } from '@/lib/admin-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SITE_URL } from '@/lib/site-config'
import { languages } from '@/lib/i18n-config'
import ViewsChart from '@/components/admin/ViewsChart'
import RankedList from '@/components/admin/RankedList'

export const dynamic = 'force-dynamic'

const PERIODS = [
  { days: 7, label: '7 dní' },
  { days: 30, label: '30 dní' },
  { days: 90, label: '90 dní' },
]

const COUNTRY_LABELS: Record<string, string> = {
  CZ: 'Česko',
  SK: 'Slovensko',
  other: 'Ostatní',
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ dny?: string }>
}) {
  const { dny } = await searchParams
  const days = PERIODS.some((p) => String(p.days) === dny) ? Number(dny) : 30

  const stats = await getViewStats(days)

  const change =
    stats.previousTotal > 0
      ? Math.round(((stats.total - stats.previousTotal) / stats.previousTotal) * 100)
      : null

  const ChangeIcon = change === null || change === 0 ? Minus : change > 0 ? ArrowUp : ArrowDown

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Statistiky
          </h1>
          <p className="text-sm text-muted-foreground">
            Vlastní počítadlo, bez cookies. Roboti se nepočítají - skript nespouštějí.
          </p>
        </div>

        {/* Filtry v jedné řadě nad grafy. */}
        <div className="flex gap-2">
          {PERIODS.map((period) => (
            <Link key={period.days} href={`/admin/statistiky?dny=${period.days}`}>
              <Badge
                variant={period.days === days ? 'default' : 'outline'}
                className="cursor-pointer"
              >
                {period.label}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Zobrazení za {days} dní
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Jediné hero číslo na stránce. */}
          <div className="mb-6 flex items-baseline gap-3">
            <span className="text-5xl font-bold tabular-nums">
              {stats.total.toLocaleString('cs-CZ')}
            </span>
            {change !== null && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <ChangeIcon className="size-4" />
                {change > 0 ? '+' : ''}
                {change} % oproti předchozím {days} dnům
              </span>
            )}
          </div>

          <ViewsChart data={stats.byDay} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nejčtenější reference</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedList
              items={stats.topReferences.map((row) => ({
                key: row.slug,
                label: row.title,
                count: row.count,
              }))}
              href={(slug) => `${SITE_URL}/cs/reference/${slug}`}
              empty="Zatím nikdo neotevřel detail reference."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Odkud lidé přicházejí</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedList
              items={stats.sources.map((row) => ({
                key: row.source,
                label:
                  row.source === 'direct'
                    ? 'Přímo (záložka, e-mail)'
                    : row.source === 'internal'
                      ? 'Proklik v rámci webu'
                      : row.source,
                count: row.count,
              }))}
              empty="Zatím žádné návštěvy."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nejnavštěvovanější stránky</CardTitle>
          </CardHeader>
          <CardContent>
            <RankedList
              items={stats.topPages.map((row) => ({
                key: row.path,
                label: row.path === '/' ? '/ (homepage)' : row.path,
                count: row.count,
              }))}
              empty="Zatím žádné návštěvy."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Země a jazyky</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Podle IP adresy</p>
              <RankedList
                items={stats.countries.map((row) => ({
                  key: row.country,
                  label: COUNTRY_LABELS[row.country] ?? row.country,
                  count: row.count,
                }))}
              />
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Podle zobrazeného jazyka</p>
              <RankedList
                items={stats.locales.map((row) => ({
                  key: row.locale,
                  label:
                    languages[row.locale as keyof typeof languages]?.name ??
                    row.locale.toUpperCase(),
                  count: row.count,
                }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
