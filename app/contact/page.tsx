import { generatePageMetadata } from '@/lib/metadata'
import ContactPage from '@/pages/ContactPage'

export const metadata = generatePageMetadata({
  title: 'Kontakt',
  description: 'Kontaktujte Jabcore — rádi si popovídáme o vašem projektu. Praha, info@jabcore.cz, +420 792 219 454.',
  path: '/contact',
})

export default ContactPage
