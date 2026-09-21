import 'server-only'

/**
 * Minimální klient Gemini API - jen to, co potřebuje překlad referencí:
 * jeden požadavek, odpověď jako JSON podle schématu.
 *
 * Bez SDK: je to jeden POST a SDK by do serverového bundlu přidalo závislost
 * kvůli jedinému volání.
 *
 * Změřeno na skutečné referenci (11 jazyků souběžně, září 2026):
 *   - Flash (3.6) překládá nejpřirozeněji, odpoví za ~10-20 s, občas 503,
 *   - Flash-Lite odpoví do 2 s a je o něco strojovější; jednou nechal název
 *     česky, jindy vynechal půlku polí, občas jeden jazyk visí 10-25 s,
 *   - na bezplatném tarifu má Flash jen 20 požadavků denně (jedna reference
 *     jich spotřebuje 11) a Pro nulu; Lite má limit mnohem vyšší.
 *
 * Proto:
 *   - první je Flash, Lite je záloha. Na bezplatném tarifu Flash vrátí 429 za
 *     půl sekundy a Lite převezme; po zapnutí placení se Flash použije sám,
 *     bez změny kódu,
 *   - když model neodpoví do svého `hedgeMs`, pustí se souběžně další a vezme
 *     se odpověď, která přijde dřív (zbytek se zruší) - jeden líný požadavek
 *     tak nezdrží celý překlad. Flash má čekání delší, jinak by ho pokaždé
 *     předběhl rychlejší Lite a Flash by se nepoužil nikdy,
 *   - chyba (429/503/timeout/404) spustí další model hned, ne až po čekání,
 *   - odpověď se ověří: chybějící pole je selhání a „nepřeložené" pole taky -
 *     pokud ale nepřeloží ani jeden model, vrátí se nejlepší výsledek, protože
 *     název jako „Jabcore Portal" je stejný v každém jazyce oprávněně.
 */

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

/*
 * Pořadí pokusů. Aliasy „latest" míří vždycky na živý model, takže až Google
 * konkrétní verzi stáhne (jako 2.5), překlad nepřestane fungovat. Přepsat jde
 * přes GEMINI_MODELS (čárkami oddělené).
 */
const DEFAULT_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
]

/**
 * Po jaké době bez odpovědi se souběžně zkusí další model. Flash běžně
 * potřebuje 10-20 s, Lite 2 s.
 */
function hedgeMs(model: string): number {
  return model.includes('lite') ? 5_000 : 25_000
}

/** Tvrdý strop jednoho požadavku. */
const REQUEST_TIMEOUT_MS = 60_000

export class GeminiError extends Error {}

/** Selhání jednoho pokusu. `fatal` = nemá smysl zkoušet další model. */
class AttemptError extends Error {
  constructor(
    message: string,
    readonly fatal = false,
    /** Odpověď přišla, jen neprošla kontrolou - lepší než nic. */
    readonly candidate?: Record<string, string>,
  ) {
    super(message)
  }
}

function models(): string[] {
  const configured = process.env.GEMINI_MODELS?.split(',')
    .map((model) => model.trim())
    .filter(Boolean)
  return configured?.length ? configured : DEFAULT_MODELS
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

interface GenerateOptions {
  system: string
  input: string
  requiredKeys: string[]
  /**
   * Věcná kontrola výsledku. Vrací popis problému, nebo null. Problém nevede
   * k chybě, jen k pokusu s dalším modelem.
   */
  check?: (result: Record<string, string>) => string | null
}

async function attempt(
  model: string,
  apiKey: string,
  body: string,
  options: GenerateOptions,
  signal: AbortSignal,
): Promise<Record<string, string>> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body,
      signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
      cache: 'no-store',
    })
  } catch {
    throw new AttemptError(`${model}: bez odpovědi`)
  }

  if (response.status === 401 || response.status === 403) {
    throw new AttemptError('Gemini odmítl API klíč. Zkontroluj GEMINI_API_KEY.', true)
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new AttemptError(`${model}: ${response.status} ${detail.slice(0, 120)}`)
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
  }
  const candidate = data.candidates?.[0]
  const text = candidate?.content?.parts?.map((part) => part.text ?? '').join('')

  if (candidate?.finishReason !== 'STOP' || !text) {
    throw new AttemptError(`${model}: nedokončená odpověď (${candidate?.finishReason ?? 'prázdná'})`)
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new AttemptError(`${model}: neplatný JSON`)
  }

  const missing = options.requiredKeys.filter(
    (key) => typeof parsed[key] !== 'string' || !(parsed[key] as string).trim(),
  )
  if (missing.length > 0) throw new AttemptError(`${model}: chybí ${missing.join(', ')}`)

  const result = Object.fromEntries(
    options.requiredKeys.map((key) => [key, (parsed[key] as string).trim()]),
  )

  const problem = options.check?.(result)
  if (problem) throw new AttemptError(`${model}: ${problem}`, false, result)

  return result
}

/**
 * Pošle text a vrátí objekt se všemi `requiredKeys` jako neprázdnými řetězci.
 */
export async function generateJson(options: GenerateOptions): Promise<Record<string, string>> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiError('Chybí GEMINI_API_KEY - překlad není nastavený (viz deploy/README.md).')
  }

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: options.system }] },
    contents: [{ role: 'user', parts: [{ text: options.input }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: Object.fromEntries(options.requiredKeys.map((key) => [key, { type: 'STRING' }])),
        // Bez required lite modely klidně vrátí jen název a zbytek vynechají.
        required: options.requiredKeys,
        propertyOrdering: options.requiredKeys,
      },
      temperature: 0.2,
      // Překlad nepotřebuje uvažování; bez něj je odpověď rychlejší a levnější.
      thinkingConfig: { thinkingLevel: 'low' },
    },
  })

  const plan = models()
  const controllers: AbortController[] = []
  const failures: string[] = []
  let fallback: Record<string, string> | undefined

  return new Promise((resolve, reject) => {
    let next = 0
    let running = 0
    let settled = false

    const finish = (outcome: () => void) => {
      if (settled) return
      settled = true
      controllers.forEach((controller) => controller.abort())
      outcome()
    }

    const launch = () => {
      if (settled) return

      if (next >= plan.length) {
        // Nic dalšího ke spuštění; až doběhnou rozjeté pokusy, rozhodne se.
        if (running > 0) return
        if (fallback) {
          const best = fallback
          finish(() => resolve(best))
          return
        }
        console.error('Gemini: všechny pokusy selhaly', failures)
        finish(() =>
          reject(new GeminiError('Překladová služba je teď přetížená. Zkus to za chvíli znovu.')),
        )
        return
      }

      const model = plan[next++]
      const controller = new AbortController()
      controllers.push(controller)
      running += 1

      // Pomalá odpověď: souběžně pustit další model, tenhle nerušit.
      const hedge = setTimeout(launch, hedgeMs(model))

      attempt(model, apiKey, body, options, controller.signal)
        .then((result) => finish(() => resolve(result)))
        .catch((error: unknown) => {
          clearTimeout(hedge)
          running -= 1
          if (settled) return

          if (error instanceof AttemptError) {
            failures.push(error.message)
            if (error.candidate) fallback ??= error.candidate
            if (error.fatal) {
              finish(() => reject(new GeminiError(error.message)))
              return
            }
          } else {
            failures.push(`${model}: ${String(error)}`)
          }

          launch()
        })
    }

    launch()
  })
}
