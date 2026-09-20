'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import ReferenceCard from './ReferenceCard'
import type { LocalizedReference } from '@/lib/reference-types'

/**
 * The filterable grid of the portfolio one-pager.
 *
 * A client component for the filter only - every reference is rendered during
 * SSR, so the full list is in the HTML that crawlers and no-JS visitors get.
 * Filtering hides what is already there rather than fetching anything.
 *
 * Labels arrive as props instead of through i18next: this page has no i18n
 * provider (see the layout), and the strings are already resolved server-side.
 */
export default function PortfolioGrid({
  references,
  industries,
  labels,
}: {
  references: LocalizedReference[]
  /** Industry keys with their translated labels, in display order. */
  industries: { key: string; label: string }[]
  labels: { all: string; year: string; empty: string }
}) {
  const [active, setActive] = useState<string | null>(null)

  const visible = useMemo(
    () => (active ? references.filter((item) => item.industry === active) : references),
    [references, active],
  )

  return (
    <>
      {industries.length > 1 && (
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          <FilterChip active={active === null} onClick={() => setActive(null)}>
            {labels.all}
          </FilterChip>
          {industries.map((industry) => (
            <FilterChip
              key={industry.key}
              active={active === industry.key}
              onClick={() => setActive(industry.key)}
            >
              {industry.label}
            </FilterChip>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-center text-muted-foreground">{labels.empty}</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((reference) => (
            <ReferenceCard
              key={reference.id}
              reference={reference}
              // The one-pager has no detail routes; the anchor keeps the card
              // linkable and lets a visitor share a single project.
              href={`#${reference.slug}`}
              labels={{ year: labels.year }}
            />
          ))}
        </div>
      )}
    </>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}>
      <Badge
        variant={active ? 'default' : 'outline'}
        className="cursor-pointer px-4 py-2 text-sm transition-colors"
      >
        {children}
      </Badge>
    </button>
  )
}
