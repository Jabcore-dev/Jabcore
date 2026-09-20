/**
 * Naplní vývojovou databázi ukázkovými referencemi.
 *
 *   npm run db:seed
 *
 * Jen pro vývoj - smaže a znovu vytvoří obsah tabulek. Na produkci ho nespouštěj.
 */
import { db } from './client'
import { references, referenceLocales } from './schema'

const data = [
  {
    slug: 'mestska-knihovna-jablonec',
    clientName: 'Městská knihovna Jablonec nad Nisou',
    year: 2025,
    industry: 'verejna-sprava',
    tech: ['Next.js', 'PostgreSQL', 'TypeScript'],
    projectUrl: null,
    sortOrder: 10,
    published: true,
    featured: true,
    locales: {
      cs: {
        title: 'Rezervační systém pro městskou knihovnu',
        summary:
          'Nahradili jsme tabulku ve sdíleném disku systémem, ve kterém si čtenáři rezervují tituly sami.',
        body: '## Zadání\n\nKnihovna evidovala rezervace ručně…',
      },
      en: {
        title: 'Reservation system for a municipal library',
        summary:
          'We replaced a shared spreadsheet with a system where readers reserve titles themselves.',
        body: '## The brief\n\nThe library tracked reservations by hand…',
      },
    },
  },
  {
    slug: 'pillsee',
    clientName: 'Jabcore',
    year: 2024,
    industry: 'zdravotnictvi',
    tech: ['Ionic', 'Capacitor', 'TypeScript'],
    projectUrl: 'https://pillsee.app',
    sortOrder: 20,
    published: true,
    featured: false,
    locales: {
      cs: {
        title: 'Pillsee - hlídání užívání léků',
        summary: 'Vlastní produkt: mobilní aplikace, která připomíná léky a hlídá interakce.',
        body: '## Proč vznikl\n\nZ vlastní potřeby…',
      },
    },
  },
]

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('✖ Seed odmítá běžet s NODE_ENV=production.')
    process.exit(1)
  }

  console.log('▶ Mažu stávající reference…')
  // reference_locales mají ON DELETE CASCADE, takže stačí smazat rodiče.
  await db.delete(references)

  for (const item of data) {
    const { locales, ...row } = item
    const [inserted] = await db.insert(references).values(row).returning()

    for (const [locale, text] of Object.entries(locales)) {
      await db.insert(referenceLocales).values({
        referenceId: inserted.id,
        locale,
        ...text,
      })
    }
    console.log(`  + ${row.slug} (${Object.keys(locales).join(', ')})`)
  }

  console.log('✔ Hotovo.')
  process.exit(0)
}

void main()
