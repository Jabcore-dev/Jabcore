/**
 * Shape of a reference after translation.
 *
 * Kept apart from references.ts because that module imports 'server-only':
 * the portfolio filter is a client component and needs this type, and a type
 * import that reaches a server-only module is a trap waiting for the first
 * person who turns it into a value import.
 */
export interface LocalizedReference {
  id: number
  slug: string
  clientName: string
  year: number | null
  industry: string | null
  coverImage: string | null
  projectUrl: string | null
  tech: string[]
  featured: boolean
  title: string
  summary: string | null
  body: string | null
  testimonial: string | null
  testimonialAuthor: string | null
  /** Locales this reference is actually translated into — used by the admin. */
  availableLocales: string[]
}
