import Image from 'next/image'
import { marked } from 'marked'
import { ArrowRight, ArrowUpRight, Quotes } from '@phosphor-icons/react/ssr'
import type { LocalizedReference } from '@/lib/reference-types'

/**
 * Detail projektu v modálním okně portfolia.
 *
 * Serverová komponenta: celý text přijde v HTML, i když ho návštěvník uvidí až
 * po kliknutí na bublinu. Mapa ho dostane hotový a jen ho ukáže - tak je case
 * study čitelná pro vyhledávač a nic se kvůli ní nestahuje dodatečně.
 */
export default async function CaseStudy({
  reference,
  industryLabel,
  hue,
  contactUrl,
  labels,
}: {
  reference: LocalizedReference
  industryLabel: string | null
  /** Barva oboru, stejná jako u bubliny na mapě. */
  hue: number
  contactUrl: string
  labels: {
    client: string
    year: string
    industry: string
    technologies: string
    viewProject: string
    featured: string
    cta: string
    ctaButton: string
  }
}) {
  const bodyHtml = reference.body ? await marked.parse(reference.body) : null

  return (
    <article
      id={reference.slug}
      data-block="case-study"
      style={{ '--hue': hue } as React.CSSProperties}
    >
      <x-case-cover>
        {reference.coverImage ? (
          <Image
            src={reference.coverImage}
            alt={reference.title}
            fill
            sizes="(min-width: 1100px) 1040px, 100vw"
          />
        ) : (
          <x-case-blank />
        )}
        <x-case-fade />
      </x-case-cover>

      <x-case-head>
        <x-flags>
          {reference.featured && <x-flag data-tone="accent">{labels.featured}</x-flag>}
          {industryLabel && (
            <x-flag data-tone="hue">
              <x-swatch aria-hidden="true" />
              {industryLabel}
            </x-flag>
          )}
        </x-flags>

        <h2>{reference.title}</h2>

        {reference.summary && <x-lead>{reference.summary}</x-lead>}
      </x-case-head>

      <x-case-layout>
        <aside>
          <dl>
            <x-fact>
              <dt>{labels.client}</dt>
              <dd>{reference.clientName}</dd>
            </x-fact>

            {reference.year && (
              <x-fact>
                <dt>{labels.year}</dt>
                <dd>{reference.year}</dd>
              </x-fact>
            )}

            {industryLabel && (
              <x-fact>
                <dt>{labels.industry}</dt>
                <dd>{industryLabel}</dd>
              </x-fact>
            )}

            {reference.tech.length > 0 && (
              <x-fact>
                <dt>{labels.technologies}</dt>
                <dd>
                  <x-tags>
                    {reference.tech.map((tech) => (
                      <x-tag key={tech}>{tech}</x-tag>
                    ))}
                  </x-tags>
                </dd>
              </x-fact>
            )}
          </dl>

          {reference.projectUrl && (
            <a
              href={reference.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-button="ghost"
            >
              {labels.viewProject}
              <ArrowUpRight size={15} weight="bold" />
            </a>
          )}
        </aside>

        <x-case-body>
          {bodyHtml && <x-richtext dangerouslySetInnerHTML={{ __html: bodyHtml }} />}

          {reference.testimonial && (
            <blockquote>
              <Quotes size={34} weight="fill" aria-hidden="true" />
              <p>{reference.testimonial}</p>
              {reference.testimonialAuthor && <footer>{reference.testimonialAuthor}</footer>}
            </blockquote>
          )}

          {/* Konec příběhu je nejlepší chvíle zeptat se na další. */}
          <x-case-cta>
            <strong>{labels.cta}</strong>
            <a href={contactUrl} data-button="solid">
              {labels.ctaButton}
              <ArrowRight size={16} weight="bold" />
            </a>
          </x-case-cta>
        </x-case-body>
      </x-case-layout>
    </article>
  )
}
