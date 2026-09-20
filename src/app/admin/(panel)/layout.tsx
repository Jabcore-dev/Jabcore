import { sql, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { contactMessages } from '@/db/schema'
import { requireSession } from '@/lib/auth/guard'
import AdminShell from '@/components/admin/AdminShell'
import { signOut } from '../actions/auth'

/**
 * Everything behind the login screen.
 *
 * The login page sits outside this group so it does not render the shell —
 * and so requireSession() here never runs for it, which would be a redirect
 * loop.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()

  // Unread count for the sidebar badge. One cheap aggregate per page load,
  // which is what makes a new inquiry visible from anywhere in the panel.
  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactMessages)
    .where(eq(contactMessages.status, 'new'))

  return (
    <AdminShell session={session} newMessages={count} signOutAction={signOut}>
      {children}
    </AdminShell>
  )
}
