'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Denní zobrazení za zvolené období.
 *
 * Sloupce, ne spojnice: u nového webu jsou dny s nulou běžné a čára by mezi
 * nimi předstírala plynulý průběh, který tam není. Jedna řada, takže legenda
 * nemá co rozlišovat - popisek nese nadpis karty.
 */

function formatDay(day: string): string {
  const [, month, date] = day.split('-')
  return `${Number(date)}. ${Number(month)}.`
}

export default function ViewsChart({ data }: { data: { day: string; count: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Zatím žádná data. Počítadlo začne sbírat, jakmile web někdo navštíví.
      </p>
    )
  }

  const max = Math.max(...data.map((row) => row.count), 1)
  const peakIndex = data.findIndex((row) => row.count === max)

  return (
    <div>
      <div className="relative">
        {/* Osa: jedna vlasová linka nahoře jako měřítko, nic víc. Hustší
            mřížka by u desítek zobrazení přidala víc inkoustu než informace. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between">
          <span className="-translate-y-1/2 bg-card pr-1 text-xs tabular-nums text-muted-foreground">
            {max}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-border" />

        {/* 2px mezery v barvě podkladu oddělují sousední sloupce. */}
        <div className="flex h-40 items-end gap-[2px] pt-4">
          {data.map((row, index) => {
            const height = (row.count / max) * 100
            const active = hovered === index

            return (
              <button
                key={row.day}
                type="button"
                // Cíl pro myš je celá výška sloupce, ne jen ta vybarvená část -
                // u dne s jedním zobrazením by se jinak trefoval na 2 pixely.
                className="group relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                aria-label={`${formatDay(row.day)}: ${row.count} zobrazení`}
              >
                <span
                  className={cn(
                    'w-full rounded-t-[4px] transition-opacity',
                    active ? 'opacity-100' : 'opacity-90',
                  )}
                  style={{
                    height: `${Math.max(height, row.count > 0 ? 2 : 0)}%`,
                    backgroundColor: 'var(--chart-bar)',
                    // Sloupec nikdy nevyplní celý slot; zbytek je vzduch.
                    maxWidth: 24,
                  }}
                />

                {active && (
                  <span className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md">
                    <strong className="tabular-nums">{row.count}</strong> · {formatDay(row.day)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Popisky jen na krajích a u maxima - číslo u každého sloupce by se
          nedalo přečíst a stejně se nečte. */}
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatDay(data[0].day)}</span>
        {data.length > 2 && peakIndex > 0 && peakIndex < data.length - 1 && (
          <span>
            maximum {max} ({formatDay(data[peakIndex].day)})
          </span>
        )}
        <span>{formatDay(data[data.length - 1].day)}</span>
      </div>

      {/* Tabulka jako rovnocenná cesta k datům - pro čtečky a pro kohokoliv,
          kdo chce přesná čísla místo odhadu z výšky sloupce. */}
      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          Zobrazit jako tabulku
        </summary>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-1 font-medium">Den</th>
              <th className="py-1 text-right font-medium">Zobrazení</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((row) => (
              <tr key={row.day} className="border-b border-border/50">
                <td className="py-1">{formatDay(row.day)}</td>
                <td className="py-1 text-right tabular-nums">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
