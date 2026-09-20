/**
 * Zakládá nebo přepisuje účet do administrace.
 *
 *   npm run admin:create -- michal@jabcore.cz "Michal Petříček" owner
 *
 * Heslo se zadává interaktivně, aby neskončilo v historii shellu. V automatizaci
 * (nebo když skript neběží z terminálu) se vezme z proměnné ADMIN_PASSWORD.
 *
 * Na serveru na to je obálka, která si načte prostředí sama:
 *
 *   ./deploy/admin.sh production admin@jabcore.cz "Jméno" owner
 *
 * Existující e-mail znamená změnu hesla, ne chybu — tohle je i cesta, jak si
 * odemknout panel, když se zapomene heslo.
 */
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { eq } from 'drizzle-orm'
import { db } from './client'
import { adminUsers } from './schema'
import { hashPassword, MIN_PASSWORD_LENGTH } from '../lib/auth/password'

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    return (await rl.question(question)).trim()
  } finally {
    rl.close()
  }
}

async function main() {
  const [rawEmail, rawName, rawRole] = process.argv.slice(2)

  const email = (rawEmail ?? (await prompt('E-mail: '))).trim().toLowerCase()
  if (!email.includes('@')) {
    console.error('✖ Zadej platný e-mail.')
    process.exit(1)
  }

  const name = rawName ?? (await prompt('Jméno: '))
  const role = rawRole === 'editor' ? 'editor' : 'owner'

  const password =
    process.env.ADMIN_PASSWORD ?? (await prompt(`Heslo (min. ${MIN_PASSWORD_LENGTH} znaků): `))
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`✖ Heslo musí mít alespoň ${MIN_PASSWORD_LENGTH} znaků.`)
    process.exit(1)
  }

  const passwordHash = await hashPassword(password)
  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1)

  if (existing) {
    await db
      .update(adminUsers)
      .set({ passwordHash, name: name || existing.name, role })
      .where(eq(adminUsers.id, existing.id))
    console.log(`✔ Účet ${email} aktualizován (role: ${role}).`)
  } else {
    await db.insert(adminUsers).values({ email, name: name || null, passwordHash, role })
    console.log(`✔ Účet ${email} vytvořen (role: ${role}).`)
  }

  process.exit(0)
}

void main()
