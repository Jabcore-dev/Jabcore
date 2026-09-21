import 'server-only'

/**
 * Minimální klient Gemini API - jen to, co potřebuje překlad referencí:
 * jeden požadavek, odpověď jako JSON podle schématu.
 *
 * Bez SDK: je to jeden POST a SDK by do serverového bundlu přidalo závislost
 * kvůli jedinému volání.
 *
 * Odolnost je tu důležitější než rychlost. Při zkoušení klíče vracely
 * nejnovější modely běžně 503 („high demand"), jeden starší 404 („no longer
 * available to new users") a jeden lite model tiše vynechal půlku polí.
 * Proto:
 *   - zkouší se řetěz modelů, od nejlepšího po záložní,
 *   - přetížení (429/503) a timeout se u stejného modelu jednou zopakuje
 *     s pauzou, pak se jde na další model,
 *   - 404 znamená „tenhle model už neexistuje" a jde se rovnou dál,
 *   - odpověď se ověří - chybějící nebo prázdné pole je selhání, ne výsledek.
 */

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

/*
 * Konkrétní model první (předvídatelný výstup), aliasy „latest" jako záloha:
 * až Google konkrétní model stáhne, aliasy pořád míří na něco živého a překlad
 * nepřestane fungovat. Přepsat jde přes GEMINI_MODELS (čárkami oddělené).
 */
const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest']

const REQUEST_TIMEOUT_MS = 45_000

export class GeminiError extends Error {}

function models(): string[] {
  const configured = process.env.GEMINI_MODELS?.split(',')
    .map((model) => model.trim())
    .filter(Boolean)
  return configured?.length ? configured : DEFAULT_MODELS
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Pošle text a vrátí objekt se všemi `requiredKeys` jako neprázdnými řetězci.
 */
export async function generateJson(options: {
  system: string
  input: string
  requiredKeys: string[]
}): Promise<Record<string, string>> {
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

  const failures: string[] = []

  for (const model of models()) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) await sleep(2_000)

      let response: Response
      try {
        response = await fetch(`${API_URL}/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          cache: 'no-store',
        })
      } catch {
        failures.push(`${model}: bez odpovědi`)
        continue
      }

      if (response.status === 429 || response.status >= 500) {
        failures.push(`${model}: ${response.status}`)
        continue
      }

      if (!response.ok) {
        // 404 = model stažený, 400 = model nepodporuje některé nastavení.
        // Opakovat stejný požadavek nemá smysl, zkusí se další model.
        const detail = await response.text().catch(() => '')
        failures.push(`${model}: ${response.status} ${detail.slice(0, 120)}`)
        if (response.status === 401 || response.status === 403) {
          throw new GeminiError('Gemini odmítl API klíč. Zkontroluj GEMINI_API_KEY.')
        }
        break
      }

      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
      }
      const candidate = data.candidates?.[0]
      const text = candidate?.content?.parts?.map((part) => part.text ?? '').join('')

      if (candidate?.finishReason !== 'STOP' || !text) {
        failures.push(`${model}: nedokončená odpověď (${candidate?.finishReason ?? 'prázdná'})`)
        continue
      }

      try {
        const parsed = JSON.parse(text) as Record<string, unknown>
        const missing = options.requiredKeys.filter(
          (key) => typeof parsed[key] !== 'string' || !(parsed[key] as string).trim(),
        )
        if (missing.length > 0) {
          failures.push(`${model}: chybí ${missing.join(', ')}`)
          break
        }
        return Object.fromEntries(
          options.requiredKeys.map((key) => [key, (parsed[key] as string).trim()]),
        )
      } catch {
        failures.push(`${model}: neplatný JSON`)
        continue
      }
    }
  }

  console.error('Gemini: všechny modely selhaly', failures)
  throw new GeminiError('Překladová služba je teď přetížená. Zkus to za chvíli znovu.')
}
