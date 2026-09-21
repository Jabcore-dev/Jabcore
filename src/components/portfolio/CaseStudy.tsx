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
    <article id={reference.slug} data-block="case-study">
      <x-case-number aria-hidden="true">
        <x-gradient>{String(index + 1).padStart(2, '0')}</x-gradient>
        <x-rule />
      </x-case-number>

      {reference.coverImage && (
        <x-case-cover>
          <x-case-halo aria-hidden="true" />
          <x-case-frame>
            <Image
              src={reference.coverImage}
              alt={reference.title}
              fill
              sizes="(min-width: 1280px) 1152px, 100vw"
            />
          </x-case-frame>
        </x-case-cover>
      )}

      <x-case-layout>
        <aside>
          <x-case-sticky>
            <h2>{reference.title}</h2>

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
                data-button="link"
              >
                {labels.viewProject}
                <ArrowUpRight size={15} weight="bold" />
              </a>
            )}
          </x-case-sticky>
        </aside>

        <x-case-body>
          {reference.summary && <x-lead>{reference.summary}</x-lead>}

          {bodyHtml && <x-richtext dangerouslySetInnerHTML={{ __html: bodyHtml }} />}

          {reference.testimonial && (
            <blockquote>
              <Quotes size={34} weight="fill" aria-hidden="true" />
              <p>{reference.testimonial}</p>
              {reference.testimonialAuthor && <footer>{reference.testimonialAuthor}</footer>}
            </blockquote>
          )}
        </x-case-body>
      </x-case-layout>
    </article>
  )
}
