'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db/client'
import { adminUsers } from '@/db/schema'
import { requireOwner } from '@/lib/auth/guard'

export interface ActionResult {
  ok: boolean
  error?: string
}

const userSchema = z.object({
  email: z.string().trim().email('Zadej platný e-mail.').max(190),
  name: z.string().trim().max(120).optional(),
  role: z.enum(['owner', 'editor']),
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
