import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Database handle for server components, route handlers and server actions.
 *
 * Created on first use, not when the module is imported. `next build` runs
 * inside the Docker image build, where no database exists and DATABASE_URL is
 * unset — a connection opened at import time would fail there and take the
 * whole build with it, including the pages that never touch the database.
 *
 * Next reloads modules on every change in development, which would open a new
 * pool each time until Postgres refuses more connections. The client is cached
 * on globalThis so a reload reuses the one that is already open; in production
 * the module is evaluated once and this is a plain singleton.
 */

type Database = ReturnType<typeof drizzle<typeof schema>>

const globalForDb = globalThis as unknown as {
  __jabcoreSql?: ReturnType<typeof postgres>
  __jabcoreDb?: Database
}

function createDatabase(): Database {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL není nastavená. Lokálně: docker compose up -d a zkopíruj .env.example do .env.local',
    )
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

  return drizzle(sql, { schema })
}

function getDatabase(): Database {
  if (!globalForDb.__jabcoreDb) globalForDb.__jabcoreDb = createDatabase()
  return globalForDb.__jabcoreDb
}

/**
 * Behaves like the Drizzle instance, but connects on the first property that
 * is actually read. Methods are bound to the real instance so `this` inside
 * Drizzle still points at it and not at the proxy.
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const database = getDatabase() as unknown as Record<string | symbol, unknown>
    const value = database[property]
    return typeof value === 'function' ? value.bind(database) : value
  },
})

export { schema }
