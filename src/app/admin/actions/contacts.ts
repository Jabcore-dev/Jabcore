'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db/client'
import { contactMessages } from '@/db/schema'
import { requireUser } from '@/lib/auth/guard'

export type MessageStatus = 'new' | 'in_progress' | 'done' | 'spam'

const STATUSES: MessageStatus[] = ['new', 'in_progress', 'done', 'spam']

export const STATUS_LABELS: Record<MessageStatus, string> = {
  new: 'Nová',
  in_progress: 'Řeší se',
  done: 'Vyřízeno',
  spam: 'Spam',
}

export async function setMessageStatus(id: number, status: MessageStatus) {
  await requireUser()

  if (!STATUSES.includes(status)) return { ok: false, error: 'Neznámý stav.' }

  await db
    .update(contactMessages)
    .set({
      status,
      // Stamped when it leaves the inbox, cleared if it comes back — so the
      // column always means "when was this actually dealt with".
      handledAt: status === 'new' ? null : new Date(),
    })
    .where(eq(contactMessages.id, id))

  revalidatePath('/admin/kontakty')
  revalidatePath('/admin')
  return { ok: true }
}

export async function setMessageNote(id: number, note: string) {
  await requireUser()

  await db
    .update(contactMessages)
    .set({ note: note.trim() || null })
    .where(eq(contactMessages.id, id))

  revalidatePath('/admin/kontakty')
  return { ok: true }
}

export async function deleteMessage(id: number) {
  await requireUser()

  await db.delete(contactMessages).where(eq(contactMessages.id, id))

  revalidatePath('/admin/kontakty')
  revalidatePath('/admin')
  return { ok: true }
}

/**
 * Stores an inquiry from the public contact form.
 *
 * Not behind the login: this is the one action the site itself calls. The
 * limits below are what stops the table filling up with junk — the form is
 * public, so whatever arrives here is untrusted.
 */
const publicMessageSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(190),
  company: z.string().trim().max(190).optional(),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1).max(5000),
  locale: z.string().trim().max(5).optional(),
})

export async function submitContactMessage(input: unknown) {
  const parsed = publicMessageSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: 'Neplatná data formuláře.' }
  }

  try {
    await db.insert(contactMessages).values({
      ...parsed.data,
      company: parsed.data.company || null,
      phone: parsed.data.phone || null,
      locale: parsed.data.locale || null,
    })

    revalidatePath('/admin/kontakty')
    return { ok: true }
  } catch (error) {
    /*
     * The visitor's e-mail is already on its way via EmailJS at this point, so
     * a database problem must not turn into an error on the form — it would
     * tell them the message did not go through when it did.
     */
    console.error('uložení poptávky selhalo', error)
    return { ok: false, error: 'Zprávu se nepodařilo uložit.' }
  }
}
