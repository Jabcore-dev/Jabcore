import { listMessages } from '@/lib/admin-data'
import MessagesManager from '@/components/admin/MessagesManager'

export const dynamic = 'force-dynamic'

export default async function AdminContactsPage() {
  const messages = await listMessages()
  return <MessagesManager messages={messages} />
}
