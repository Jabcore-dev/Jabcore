'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db/client'
import { adminUsers } from '@/db/schema'
import { requireUser, requireOwner } from '@/lib/auth/guard'
import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth/password'

export interface ActionResult {
  ok: boolean
  error?: string
}

const userSchema = z.object({
  email: z.string().trim().email('Zadej platný e-mail.').max(190),
  name: z.string().trim().max(120).optional(),
  role: z.enum(['owner', 'editor']),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Heslo musí mít alespoň ${MIN_PASSWORD_LENGTH} znaků.`),
})

/** How many owners exist besides this one. */
async function otherOwnerCount(exceptId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(adminUsers)
    .where(and(eq(adminUsers.role, 'owner'), ne(adminUsers.id, exceptId)))

  return row?.count ?? 0
}

export async function createUser(input: unknown): Promise<ActionResult> {
  await requireOwner()

  const parsed = userSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Neplatná data.' }
  }

  const email = parsed.data.email.toLowerCase()

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1)

  if (existing) return { ok: false, error: 'Účet s tímhle e-mailem už existuje.' }

  await db.insert(adminUsers).values({
    email,
    name: parsed.data.name || null,
    role: parsed.data.role,
    passwordHash: await hashPassword(parsed.data.password),
  })

  revalidatePath('/admin/uzivatele')
  return { ok: true }
}

export async function updateUser(
  id: number,
  input: { name?: string; role: 'owner' | 'editor' },
): Promise<ActionResult> {
  await requireOwner()

  /*
   * Demoting the last owner would leave nobody able to manage accounts, and
   * the only way back would be the command line on the server.
   */
  if (input.role !== 'owner' && (await otherOwnerCount(id)) === 0) {
    return { ok: false, error: 'Musí zůstat alespoň jeden vlastník.' }
  }

  await db
    .update(adminUsers)
    .set({ name: input.name?.trim() || null, role: input.role })
    .where(eq(adminUsers.id, id))

  revalidatePath('/admin/uzivatele')
  return { ok: true }
}

export async function deleteUser(id: number): Promise<ActionResult> {
  const session = await requireOwner()

  // Deleting yourself would log you out mid-action with no warning.
  if (session.userId === id) {
    return { ok: false, error: 'Vlastní účet smazat nejde.' }
  }

  if ((await otherOwnerCount(id)) === 0) {
    return { ok: false, error: 'Musí zůstat alespoň jeden vlastník.' }
  }

  await db.delete(adminUsers).where(eq(adminUsers.id, id))

  revalidatePath('/admin/uzivatele')
  return { ok: true }
}

/** An owner resetting somebody else's password — no old password needed. */
export async function resetPassword(id: number, password: string): Promise<ActionResult> {
  await requireOwner()

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Heslo musí mít alespoň ${MIN_PASSWORD_LENGTH} znaků.` }
  }

  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(adminUsers.id, id))

  revalidatePath('/admin/uzivatele')
  return { ok: true }
}

/** Changing your own password, which does require the current one. */
export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult> {
  const session = await requireUser()

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Nové heslo musí mít alespoň ${MIN_PASSWORD_LENGTH} znaků.` }
  }

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.userId))
    .limit(1)

  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return { ok: false, error: 'Současné heslo nesouhlasí.' }
  }

  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(adminUsers.id, session.userId))

  return { ok: true }
}
