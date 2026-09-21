import Image from 'next/image'
import { marked } from 'marked'
import { ArrowUpRight, Quotes } from '@phosphor-icons/react/ssr'
import type { LocalizedReference } from '@/lib/reference-types'

/**
 * Jedna case study pod mapou.
 *
 * Mapa je pro ukazování, tohle je pro čtení - a taky to je verze, kterou
 * dostane vyhledávač a návštěvník bez JavaScriptu. Proto je to serverová
 * komponenta a celý text je v HTML, které přijde ze serveru.
 */
export default async function CaseStudy({
  reference,
  index,
  industryLabel,
  labels,
}: {
  reference: LocalizedReference
  /** Pořadí na stránce, vypisuje se jako 01, 02 … */
  index: number
  industryLabel: string | null
  labels: {
    client: string
    year: string
    industry: string
    technologies: string
    viewProject: string
  }
}) {
  const bodyHtml = reference.body ? await marked.parse(reference.body) : null

  return (
    <article id={reference.slug} className="scroll-mt-24">
      <div className="mb-8 flex items-baseline gap-4 sm:gap-6">
        <span
          className="gradient-text text-5xl font-bold leading-none sm:text-6xl"
          style={{ fontFamily: 'var(--font-display)' }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>

      {reference.coverImage && (
        <div className="relative mb-10 sm:mb-14">
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-[2rem] bg-[linear-gradient(120deg,var(--primary),var(--accent))] opacity-15 blur-2xl"
          />
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-2xl">
            <Image
              src={reference.coverImage}
              alt={reference.title}
              fill
              sizes="(min-width: 1280px) 1152px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <h2
              className="mb-4 text-3xl font-bold leading-tight sm:text-4xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {reference.title}
            </h2>

            <dl className="space-y-4 border-t border-border/60 pt-5 text-sm">
              <div>
                <dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {labels.client}
                </dt>
                <dd className="font-medium">{reference.clientName}</dd>
              </div>

              {reference.year && (
                <div>
                  <dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {labels.year}
                  </dt>
                  <dd className="font-medium">{reference.year}</dd>
                </div>
              )}

              {industryLabel && (
                <div>
                  <dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {labels.industry}
                  </dt>
                  <dd className="font-medium">{industryLabel}</dd>
                </div>
              )}

              {reference.tech.length > 0 && (
                <div>
                  <dt className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {labels.technologies}
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {reference.tech.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-border/70 bg-secondary/60 px-2.5 py-1 text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            {reference.projectUrl && (
              <a
                href={reference.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-accent"
              >
                {labels.viewProject}
                <ArrowUpRight
                  size={15}
                  weight="bold"
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            )}
          </div>
        </aside>

        <div className="lg:col-span-8">
          {reference.summary && (
            <p className="mb-8 text-xl leading-relaxed text-foreground/80 sm:text-2xl">
              {reference.summary}
            </p>
          )}

          {bodyHtml && <div className="richtext" dangerouslySetInnerHTML={{ __html: bodyHtml }} />}

          {reference.testimonial && (
            <blockquote className="relative mt-10 overflow-hidden rounded-2xl border border-border/60 bg-secondary/40 p-6 pt-12 sm:p-8 sm:pt-14">
              <Quotes
                size={34}
                weight="fill"
                className="absolute left-6 top-5 text-accent/50 sm:left-8"
                aria-hidden="true"
              />
              <p className="text-lg italic leading-relaxed sm:text-xl">{reference.testimonial}</p>
              {reference.testimonialAuthor && (
                <footer className="mt-4 text-sm font-medium text-muted-foreground">
                  {reference.testimonialAuthor}
                </footer>
              )}
            </blockquote>
          )}
        </div>
      </div>
    </article>
  )
}
