import { listReferences } from '@/lib/admin-data'
import ReferencesManager from '@/components/admin/ReferencesManager'

// The panel always shows the current state of the database, never a cached one.
export const dynamic = 'force-dynamic'

export default async function AdminReferencesPage() {
  const references = await listReferences()
  return <ReferencesManager references={references} />
}
