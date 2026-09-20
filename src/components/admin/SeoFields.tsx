'use client'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SITE_URL } from '@/lib/site-config'

/**
 * Meta title a description pro jeden jazyk, s náhledem výsledku ve vyhledávání.
 *
 * Prázdná pole jsou v pořádku - web pak použije název a perex, jak to dělal
 * předtím, než tahle pole vznikla. Smysl mají tam, kde se text pro čtenáře na
 * kartě a text, který má někoho přimět ke kliknutí, rozcházejí.
 */

// Meze, za kterými Google text ořízne. Nejsou to tvrdá pravidla - Google měří
// šířku v pixelech, ne znaky - proto varujeme, ale needitujeme.
const TITLE_LIMIT = 60
const DESCRIPTION_LIMIT = 155

function Counter({ value, limit }: { value: string; limit: number }) {
  const length = value.trim().length
  if (length === 0) return null

  return (
    <span
      className={cn(
        'text-xs tabular-nums',
        length > limit ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground',
      )}
    >
      {length} / {limit}
      {length > limit && ' - Google nejspíš ořízne'}
    </span>
  )
}

export default function SeoFields({
  locale,
  slug,
  fallbackTitle,
  fallbackDescription,
  metaTitle,
  metaDescription,
  onChange,
}: {
  locale: string
  slug: string
  fallbackTitle: string
  fallbackDescription: string
  metaTitle: string
  metaDescription: string
  onChange: (field: 'metaTitle' | 'metaDescription', value: string) => void
}) {
  const shownTitle = metaTitle.trim() || fallbackTitle || 'Název reference'
  const shownDescription =
    metaDescription.trim() || fallbackDescription || 'Perex se doplní z obsahu reference.'

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div>
        <h4 className="text-sm font-medium">Vyhledávače</h4>
        <p className="text-xs text-muted-foreground">
          Nepovinné. Prázdné pole = použije se název a perex.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`metaTitle-${locale}`}>Titulek ve vyhledávání</Label>
          <Counter value={metaTitle} limit={TITLE_LIMIT} />
        </div>
        <Input
          id={`metaTitle-${locale}`}
          value={metaTitle}
          onChange={(event) => onChange('metaTitle', event.target.value)}
          placeholder={fallbackTitle || 'Převezme se název'}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`metaDescription-${locale}`}>Popisek ve vyhledávání</Label>
          <Counter value={metaDescription} limit={DESCRIPTION_LIMIT} />
        </div>
        <Textarea
          id={`metaDescription-${locale}`}
          rows={2}
          value={metaDescription}
          onChange={(event) => onChange('metaDescription', event.target.value)}
          placeholder={fallbackDescription || 'Převezme se perex'}
        />
      </div>

      {/* Přibližný náhled. Google si titulek i popisek někdy přepíše podle
          dotazu, takže je to vodítko, ne záruka. */}
      <div className="rounded-md bg-muted/50 p-3">
        <p className="mb-2 text-xs text-muted-foreground">Přibližně takhle to uvidí návštěvník:</p>
        <div className="space-y-0.5">
          <div className="truncate text-xs text-muted-foreground">
            {SITE_URL.replace(/^https?:\/\//, '')} › {locale} › reference › {slug || 'slug'}
          </div>
          <div className="truncate text-base text-blue-700 dark:text-blue-400">{shownTitle}</div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{shownDescription}</p>
        </div>
      </div>
    </div>
  )
}
