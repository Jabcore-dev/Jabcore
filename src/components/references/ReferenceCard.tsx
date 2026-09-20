import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LocalizedReference } from '@/lib/reference-types'

/**
 * One reference in a listing.
 *
 * A server component on purpose: the whole card is text and one image, so
 * shipping it as HTML keeps the content in the page for crawlers and costs the
 * visitor no JavaScript.
 */
export default function ReferenceCard({
  reference,
  href,
  labels,
}: {
  reference: LocalizedReference
  href: string
  labels: { year: string }
}) {
  return (
    <Card className="group h-full overflow-hidden transition-colors hover:border-primary/50">
      <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {reference.coverImage ? (
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            <Image
              src={reference.coverImage}
              alt=""
              fill
              // Three columns on desktop, two on tablet, full width on phones -
              // without this next/image would serve a full-width file to every
              // card in the grid.
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          // Keeps the grid aligned when a reference has no image yet.
          <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-accent/10" />
        )}

        <CardContent className="p-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{reference.clientName}</span>
            {reference.year && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  <span className="sr-only">{labels.year}: </span>
                  {reference.year}
                </span>
              </>
            )}
          </div>

          <h3 className="mb-3 text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            {reference.title}
          </h3>

          {reference.summary && (
            <p className="mb-4 line-clamp-3 text-muted-foreground">{reference.summary}</p>
          )}

          {reference.tech.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {/* Four tags fit one line at card width; the rest would wrap and
                  push every card in the row taller. */}
              {reference.tech.slice(0, 4).map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
              {reference.tech.length > 4 && (
                <Badge variant="outline">+{reference.tech.length - 4}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
