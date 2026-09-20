import type { Config } from 'drizzle-kit'

/**
 * Drizzle Kit - generates migrations from src/db/schema.ts.
 *
 *   npm run db:generate   po změně schématu, vygeneruje .sql do src/db/migrations
 *   npm run db:migrate    aplikuje je (dělá i build.sh při deployi)
 *   npm run db:studio     prohlížeč databáze
 *
 * Migrace se commitují - jsou to ony, co běží na serveru, ne tenhle soubor.
 */
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://jabcore:jabcore@127.0.0.1:5434/jabcore',
  },
} satisfies Config
