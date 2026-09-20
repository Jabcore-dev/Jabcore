/**
 * Applies pending migrations, then exits.
 *
 * Run as a visible one-shot by build.sh before the new web container starts —
 * not from the app's boot, where the healthcheck would race it and a failure
 * would be buried in a restart loop.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('✖ DATABASE_URL není nastavená.')
  process.exit(1)
}

// max: 1 — migrations must run in order on a single connection, and this
// process exits the moment they are done.
const sql = postgres(connectionString, { max: 1 })

// Wrapped in a function rather than using top-level await: package.json has no
// "type": "module", so this is transpiled to CommonJS, where top-level await
// is a syntax error.
async function main() {
  try {
    console.log('▶ Spouštím migrace…')
    await migrate(drizzle(sql), { migrationsFolder: 'src/db/migrations' })
    console.log('✔ Migrace hotové.')
  } catch (error) {
    console.error('✖ Migrace selhaly:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

void main()
