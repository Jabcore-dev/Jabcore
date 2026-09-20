import { cn } from '@/lib/utils'

/**
 * Žebříček s proužkem na pozadí řádku.
 *
 * Ne koláč: u podílů jde o pořadí a velikost, a to se z délky čte přesněji než
 * z úhlu. Proužek je pozadí řádku, takže text zůstává v běžné barvě písma -
 * identitu nese proužek, ne obarvené písmo.
 */
export default function RankedList({
  items,
  empty = 'Zatím žádná data.',
  href,
}: {
  items: { key: string; label: string; count: number }[]
  empty?: string
  href?: (key: string) => string
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
  }

  const max = Math.max(...items.map((item) => item.count), 1)

  return (
    <ol className="space-y-1">
      {items.map((item) => {
        const content = (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 rounded-[4px]"
              style={{ width: `${(item.count / max) * 100}%`, backgroundColor: 'var(--chart-track)' }}
            />
            <span className="relative truncate pr-3">{item.label}</span>
            <span className="relative shrink-0 tabular-nums text-muted-foreground">
              {item.count}
            </span>
          </>
        )

        return (
          <li key={item.key} className="relative flex items-center justify-between overflow-hidden rounded-[4px] px-2 py-1.5 text-sm">
            {href ? (
              <a
                href={href(item.key)}
                target="_blank"
                rel="noreferrer"
                className={cn('contents hover:underline')}
              >
                {content}
              </a>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ol>
  )
}
