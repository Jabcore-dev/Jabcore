import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  boolean,
  timestamp,
  date,
  primaryKey,
  unique,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Reference / portfolio.
 *
 * Split in two on purpose: everything language-neutral lives here, every
 * translatable string lives in referenceLocales. Adding a thirteenth language
 * is then a row, not a migration - see PLAN.md.
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

    /** Shown as-is in every language - company names are not translated. */
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

    /**
     * Visible on the site but kept out of search results. For a reference the
     * client agreed to show but not to advertise - hiding it entirely would
     * mean unpublishing, which also takes it off the portfolio page.
     */
    noindex: boolean('noindex').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // The public listing is always "published, in order" - without this it is
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

    /** 'cs' | 'en' | … - validated against locales in i18n-config. */
    locale: varchar('locale', { length: 5 }).notNull(),

    title: varchar('title', { length: 200 }).notNull(),

    /** One or two sentences for cards and listings. */
    summary: text('summary'),

    /** Full case study, Markdown. */
    body: text('body'),

    testimonial: text('testimonial'),
    testimonialAuthor: varchar('testimonial_author', { length: 160 }),

    /*
     * Search-result text, separate from title/summary on purpose: the perex is
     * written for someone already looking at the card, the meta description is
     * written to make someone click from a results page. Empty means "derive
     * it from title/summary", which is what the site did before these existed.
     */
    metaTitle: varchar('meta_title', { length: 200 }),
    metaDescription: varchar('meta_description', { length: 320 }),

    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.referenceId, table.locale] }),
  ],
)

/**
 * Old URLs that must keep working.
 *
 * Filled automatically when a slug changes in the admin: the previous address
 * is already linked from elsewhere and indexed, and letting it 404 throws away
 * both the visitors and the ranking it earned. A 301 hands both to the new URL.
 */
export const slugRedirects = pgTable(
  'slug_redirects',
  {
    id: serial('id').primaryKey(),

    /** The slug that used to exist. Unique - one old slug, one destination. */
    fromSlug: varchar('from_slug', { length: 120 }).notNull().unique(),

    referenceId: integer('reference_id')
      .notNull()
      .references(() => references.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('slug_redirects_from_idx').on(table.fromSlug)],
)

/**
 * Page views, aggregated per day.
 *
 * Counted by a beacon from the browser rather than on the server, because
 * pages are served from the ISR cache and never re-render per visit. A welcome
 * side effect: crawlers do not run the script, so the numbers are people
 * rather than bots.
 *
 * No cookies and no identifier of any kind - one row per day per combination,
 * incremented. Nothing here can be traced back to a person, so it needs no
 * consent banner.
 */
export const pageViews = pgTable(
  'page_views',
  {
    id: serial('id').primaryKey(),

    /** Path without the locale prefix, e.g. "/reference/mestska-knihovna". */
    path: varchar('path', { length: 255 }).notNull(),

    /** Set when the page is a reference, so the admin can rank them. */
    referenceId: integer('reference_id').references(() => references.id, {
      onDelete: 'cascade',
    }),

    locale: varchar('locale', { length: 5 }).notNull(),

    /** Date only - hourly detail is noise at this traffic. */
    day: date('day').notNull(),

    /** Referrer host, or 'direct'. Never the full URL. */
    source: varchar('source', { length: 120 }).notNull().default('direct'),

    /** 'CZ' | 'SK' | 'other' - the three our IP table can tell apart. */
    country: varchar('country', { length: 10 }).notNull().default('other'),

    count: integer('count').notNull().default(1),
  },
  (table) => [
    // The upsert target: one row per combination per day, incremented.
    unique('page_views_unique').on(
      table.path,
      table.locale,
      table.day,
      table.source,
      table.country,
    ),
    index('page_views_day_idx').on(table.day),
    index('page_views_reference_idx').on(table.referenceId, table.day),
  ],
)

/**
 * Admin accounts. Deliberately tiny - this is a handful of people editing a
 * marketing site, not a user system.
 */
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),

  /** Lowercased on write, so logging in is not case sensitive. */
  email: varchar('email', { length: 190 }).notNull().unique(),

  /** bcrypt hash. Never the password. */
  passwordHash: text('password_hash').notNull(),

  name: varchar('name', { length: 120 }),

  /**
   * 'owner' may add and remove other accounts; 'editor' may only edit content.
   * The last remaining owner cannot be deleted or demoted - otherwise the panel
   * locks everyone out of user management with no way back in from the UI.
   */
  role: varchar('role', { length: 20 }).notNull().default('editor'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
})

/**
 * Messages from the contact form.
 *
 * The form used to go straight to EmailJS from the browser, so an inquiry that
 * failed to send, or that someone deleted from the mailbox, left no trace at
 * all. Storing it first means the record survives whatever happens to the mail.
 */
export const contactMessages = pgTable(
  'contact_messages',
  {
    id: serial('id').primaryKey(),

    name: varchar('name', { length: 160 }).notNull(),
    email: varchar('email', { length: 190 }).notNull(),
    company: varchar('company', { length: 190 }),
    phone: varchar('phone', { length: 40 }),
    message: text('message').notNull(),

    /** Which language the site was in when they wrote - answer in that one. */
    locale: varchar('locale', { length: 5 }),

    /** 'new' | 'in_progress' | 'done' | 'spam' */
    status: varchar('status', { length: 20 }).notNull().default('new'),

    /** Internal note, never shown to the sender. */
    note: text('note'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    handledAt: timestamp('handled_at', { withTimezone: true }),
  },
  (table) => [
    // The inbox is always "newest first, optionally filtered by status".
    index('contact_messages_status_created_idx').on(table.status, table.createdAt),
  ],
)

export type SlugRedirect = typeof slugRedirects.$inferSelect
export type PageView = typeof pageViews.$inferSelect
export type AdminRole = 'owner' | 'editor'
export type ContactMessage = typeof contactMessages.$inferSelect
export type NewContactMessage = typeof contactMessages.$inferInsert

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
