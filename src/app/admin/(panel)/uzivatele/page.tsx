import { redirect } from 'next/navigation'
import { listUsers } from '@/lib/admin-data'
import { requireSession } from '@/lib/auth/guard'
import UsersManager from '@/components/admin/UsersManager'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await requireSession()

  // The sidebar hides this link from editors; this is what actually keeps them
  // out of the page if they type the URL.
  if (session.role !== 'owner') redirect('/admin')

  const users = await listUsers()
  return <UsersManager users={users} session={session} />
}
