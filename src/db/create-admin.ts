/**
 * Zakládá nebo mění účet do administrace.
 *
 *   npm run admin:create -- michal@jabcore.cz "Michal Petříček" owner
 *
 * Hesla tu nejsou: přihlašuje Jabcore Platform a řádek v admin_users jen říká,
 * že tenhle e-mail smí do panelu a s jakou rolí. Tohle je cesta dovnitř, když
 * v panelu nezůstal žádný vlastník.
 *
 * Na serveru na to je obálka, která si načte prostředí sama:
 *
 *   ./deploy/admin.sh production admin@jabcore.cz "Jméno" owner
 */
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { eq } from 'drizzle-orm'
import { db } from './client'
import { adminUsers } from './schema'

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

  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1)

  if (existing) {
    await db
      .update(adminUsers)
      .set({ name: name || existing.name, role })
      .where(eq(adminUsers.id, existing.id))
    console.log(`✔ Účet ${email} aktualizován (role: ${role}).`)
  } else {
    await db.insert(adminUsers).values({ email, name: name || null, role })
    console.log(`✔ Účet ${email} vytvořen (role: ${role}).`)
  }

  process.exit(0)
}

void main()
