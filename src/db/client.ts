import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Database handle for server components, route handlers and server actions.
 *
 * Next reloads modules on every change in development, which would open a new
 * pool each time until Postgres refuses more connections. The client is cached
 * on globalThis so a reload reuses the one that is already open — in
 * production the module is evaluated once and this is a plain singleton.
 */

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL není nastavená. Lokálně: docker compose up -d a zkopíruj .env.example do .env.local',
  )
}

const globalForDb = globalThis as unknown as {
  __jabcoreSql?: ReturnType<typeof postgres>
}

const sql =
  globalForDb.__jabcoreSql ??
  postgres(connectionString, {
    // The app runs as a single container behind a proxy; ten connections is
    // plenty and leaves headroom for migrations and psql.
    max: 10,
    // Idle connections are dropped rather than held open across a deploy.
    idle_timeout: 20,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.__jabcoreSql = sql

export const db = drizzle(sql, { schema })
export { schema }
