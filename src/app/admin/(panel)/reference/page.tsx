import { listReferences } from '@/lib/admin-data'
import { t } from '@/lib/server-i18n'
import { INDUSTRIES } from '@/lib/industries'
import { isGeminiConfigured } from '@/lib/gemini'
import ReferencesManager from '@/components/admin/ReferencesManager'

// The panel always shows the current state of the database, never a cached one.
export const dynamic = 'force-dynamic'

export default async function AdminReferencesPage() {
  const references = await listReferences()

  // Popisky oborů jdou ze serveru hotové: admin je česky a formulář by jinak
  // musel do prohlížeče tahat celý locale soubor kvůli patnácti slovům.
  const industryOptions = INDUSTRIES.map((industry) => ({
    key: industry.key,
    label: t('cs', `references.industries.${industry.key}`),
  }))

  return (
    <ReferencesManager
      references={references}
      industryOptions={industryOptions}
      canTranslate={isGeminiConfigured()}
    />
  )
}
