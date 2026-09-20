import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  boolean,
  timestamp,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Reference / portfolio.
 *
 * Split in two on purpose: everything language-neutral lives here, every
 * translatable string lives in referenceLocales. Adding a thirteenth language
 * is then a row, not a migration — see PLAN.md.
 */
export const references = pgTable(
  // "references" alone is a reserved word in SQL: Drizzle quotes identifiers
  // so the app would work, but every hand-written query, psql session and
  // restore would need the quotes too, and the error it gives when they are
  // missing ("syntax error at or near") points nowhere near the cause.
  'project_references',
  {
    id: serial('id').primaryKey(),

    /** URL segment, e.g. "mestska-knihovna". Unique across the site. */
    slug: varchar('slug', { length: 120 }).notNull().unique(),

    /** Shown as-is in every language — company names are not translated. */
    clientName: varchar('client_name', { length: 160 }).notNull(),

    /** Year the project shipped. Null while it is still running. */
    year: integer('year'),

    /**
     * Industry key, e.g. "verejna-sprava". The label itself is translated in
     * the locale JSON, so filters in the portfolio one-pager work in every
     * language without the admin having to translate the same word per item.
     */
    industry: varchar('industry', { length: 60 }),

    /** Path under /uploads, written by the admin's image upload. */
    coverImage: varchar('cover_image', { length: 255 }),

    /** Live project, when there is a public one. */
    projectUrl: varchar('project_url', { length: 255 }),

    /** Tech tags, e.g. ["Next.js", "Postgres"]. Names, so never translated. */
    tech: text('tech').array().notNull().default([]),

    /** Manual ordering in the admin; lower comes first. */
    sortOrder: integer('sort_order').notNull().default(0),

    /**
     * Unpublished references stay invisible on both sites. This is what lets
     * a half-finished translation sit in the admin without reaching visitors.
     */
    published: boolean('published').notNull().default(false),

    /** Pinned to the top of the portfolio one-pager. */
    featured: boolean('featured').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // The public listing is always "published, in order" — without this it is
    // a sequential scan plus a sort on every request.
    index('project_references_published_order_idx').on(table.published, table.sortOrder),
  ],
)

/**
 * One row per language per reference. A missing row is not an error: the site
 * falls back to Czech, exactly like server-i18n.ts does for the locale JSON.
 */
export const referenceLocales = pgTable(
  'reference_locales',
  {
    referenceId: integer('reference_id')
      .notNull()
      // Deleting a reference takes its translations with it; leaving orphans
      // would silently keep them out of every listing but inside every backup.
      .references(() => references.id, { onDelete: 'cascade' }),

    /** 'cs' | 'en' | … — validated against locales in i18n-config. */
    locale: varchar('locale', { length: 5 }).notNull(),

    title: varchar('title', { length: 200 }).notNull(),

    /** One or two sentences for cards and listings. */
    summary: text('summary'),

    /** Full case study, Markdown. */
    body: text('body'),

    testimonial: text('testimonial'),
    testimonialAuthor: varchar('testimonial_author', { length: 160 }),

    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.referenceId, table.locale] }),
  ],
)

/**
 * Admin accounts. Deliberately tiny — this is a handful of people editing a
 * marketing site, not a user system.
 */
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 190 }).notNull().unique(),
  /** argon2 hash. Never the password. */
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
})

export const referencesRelations = relations(references, ({ many }) => ({
  locales: many(referenceLocales),
}))

export const referenceLocalesRelations = relations(referenceLocales, ({ one }) => ({
  reference: one(references, {
    fields: [referenceLocales.referenceId],
    references: [references.id],
  }),
}))

export type Reference = typeof references.$inferSelect
export type NewReference = typeof references.$inferInsert
export type ReferenceLocale = typeof referenceLocales.$inferSelect
export type NewReferenceLocale = typeof referenceLocales.$inferInsert
export type AdminUser = typeof adminUsers.$inferSelect
