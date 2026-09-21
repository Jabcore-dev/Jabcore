import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/guard'
import { locales, defaultLocale, type Locale } from '@/lib/i18n-config'
import { GeminiError } from '@/lib/gemini'
import { translateReferenceFields } from '@/lib/reference-translation'

/**
 * Překlad reference z češtiny do jednoho jazyka.
 *
 * Route handler, ne server action. Server actions volané z prohlížeče řadí
 * Next do fronty a pouští jednu po druhé (router actionQueue), takže
 * „jedenáct jazyků souběžně" ve skutečnosti běželo postupně a trvalo minuty.
 * Obyčejné fetch() na tenhle endpoint běží opravdu paralelně.
 *
 * Jeden jazyk na požadavek: admin u každé záložky hned vidí, že je hotová,
 * a selhání jednoho jazyka nezahodí ostatní.
 *
 * Výsledek se neukládá - vrací se do formuláře a do databáze jde až tlačítkem
 * Uložit.
 *
 * /api je mimo middleware, takže přihlášení se ověřuje tady. Cizí web sem
 * přihlášeně nezavolá: session cookie je SameSite=Lax (cross-site POST ji
 * nepošle) a JSON tělo vynucuje CORS preflight.
 */

export const dynamic = 'force-dynamic'

const inputSchema = z.object({
  locale: z
    .string()
    .refine(
      (value): value is Locale =>
        (locales as readonly string[]).includes(value) && value !== defaultLocale,
      'Neplatný cílový jazyk.',
    ),
  source: z.object({
    title: z.string().trim().min(1, 'Nejdřív vyplň český název.').max(200),
    summary: z.string().max(2000).optional(),
    body: z.string().max(50_000).optional(),
    testimonial: z.string().max(2000).optional(),
    testimonialAuthor: z.string().max(160).optional(),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(320).optional(),
  }),
})

export async function POST(request: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Nepřihlášen.' }, { status: 401 })
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Očekávám JSON.' }, { status: 415 })
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Neplatná data.' },
      { status: 400 },
    )
  }

  try {
    const translation = await translateReferenceFields(
      parsed.data.source,
      parsed.data.locale as Locale,
    )
    return NextResponse.json({ translation })
  } catch (error) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: 502 })
    }
    console.error('Překlad reference selhal', error)
    return NextResponse.json({ error: 'Překlad selhal.' }, { status: 500 })
  }
}
