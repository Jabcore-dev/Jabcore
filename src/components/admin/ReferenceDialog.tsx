'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkle } from '@phosphor-icons/react'
import { locales, defaultLocale, languages } from '@/lib/i18n-config'
import { saveReference } from '@/app/admin/actions/references'
import type { AdminReference } from '@/lib/admin-data'
import { isIndustryKey } from '@/lib/industries'
import ImageField from './ImageField'
import SeoFields from './SeoFields'

type Translation = {
  title: string
  summary: string
  body: string
  testimonial: string
  testimonialAuthor: string
  metaTitle: string
  metaDescription: string
}

const emptyTranslation: Translation = {
  title: '',
  summary: '',
  body: '',
  testimonial: '',
  testimonialAuthor: '',
  metaTitle: '',
  metaDescription: '',
}

function toFormState(reference: AdminReference | null) {
  const translations: Record<string, Translation> = {}

  for (const locale of locales) {
    const existing = reference?.translations[locale]
    translations[locale] = existing
      ? {
          title: existing.title ?? '',
          summary: existing.summary ?? '',
          body: existing.body ?? '',
          testimonial: existing.testimonial ?? '',
          testimonialAuthor: existing.testimonialAuthor ?? '',
          metaTitle: existing.metaTitle ?? '',
          metaDescription: existing.metaDescription ?? '',
        }
      : { ...emptyTranslation }
  }

  return {
    id: reference?.id,
    slug: reference?.slug ?? '',
    clientName: reference?.clientName ?? '',
    year: reference?.year ? String(reference.year) : '',
    industry: reference?.industry ?? '',
    coverImage: reference?.coverImage ?? null,
    projectUrl: reference?.projectUrl ?? '',
    tech: reference?.tech.join(', ') ?? '',
    sortOrder: reference?.sortOrder ?? 0,
    published: reference?.published ?? false,
    featured: reference?.featured ?? false,
    noindex: reference?.noindex ?? false,
    translations,
  }
}

/** Hodnota Selectu pro „bez oboru" - Radix nepovoluje prázdný řetězec. */
const NO_INDUSTRY = '__none__'

type TranslateStatus = 'working' | 'error'

/**
 * Jeden jazyk přes /api/admin/translate. Přes fetch, ne server action:
 * server actions pouští Next jednu po druhé a jazyky by se řadily za sebe.
 */
async function requestTranslation(
  locale: string,
  source: Translation,
): Promise<{ ok: true; translation: Partial<Translation> } | { ok: false; error: string }> {
  try {
    const response = await fetch('/api/admin/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale, source }),
    })
    const data = (await response.json()) as { translation?: Partial<Translation>; error?: string }
    if (!response.ok || !data.translation) {
      return { ok: false, error: data.error ?? 'Překlad selhal.' }
    }
    return { ok: true, translation: data.translation }
  } catch {
    return { ok: false, error: 'Překlad selhal - zkontroluj připojení.' }
  }
}

/** "Rezervační systém" → "rezervacni-system" */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    // Strips the diacritic marks that NFD just separated out, so Czech titles
    // produce an ASCII slug instead of one the browser has to percent-encode.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

export default function ReferenceDialog({
  reference,
  industryOptions,
  canTranslate,
  open,
  onOpenChange,
  onSaved,
}: {
  reference: AdminReference | null
  industryOptions: { key: string; label: string }[]
  /** Je nastavený klíč ke Gemini. */
  canTranslate: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(() => toFormState(reference))
  const [locale, setLocale] = useState<string>(defaultLocale)
  const [pending, startTransition] = useTransition()

  // Remounting on open (see the key on this component) is what resets the form
  // between editing two different references.
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const setTranslation = (field: keyof Translation, value: string) =>
    setForm((previous) => ({
      ...previous,
      translations: {
        ...previous.translations,
        [locale]: { ...previous.translations[locale], [field]: value },
      },
    }))

  const current = form.translations[locale]

  const [status, setStatus] = useState<Record<string, TranslateStatus>>({})
  const [translating, setTranslating] = useState(false)
  const [confirmRetranslate, setConfirmRetranslate] = useState(false)
  // Výchozí zapnuto: typický případ je „vyplním češtinu a uložím" a ostatní
  // jazyky se mají doplnit samy.
  const [autoTranslate, setAutoTranslate] = useState(canTranslate)

  const otherLocales = locales.filter((code) => code !== defaultLocale)
  const missingLocales = otherLocales.filter((code) => !form.translations[code].title.trim())
  const czechReady = Boolean(form.translations[defaultLocale].title.trim())

  /** Stará hodnota oboru, která není v seznamu - admin ji musí přeřadit. */
  const legacyIndustry =
    form.industry && !industryOptions.some((option) => option.key === form.industry)
      ? form.industry
      : null

  /**
   * Přeloží češtinu do zadaných jazyků a výsledky rovnou zapisuje do
   * formuláře, jak postupně přicházejí. Cílový jazyk se nahrazuje celý: pole,
   * které je v češtině prázdné, bude prázdné i v překladu - jinak by po
   * smazání české citace zůstala viset ta anglická.
   *
   * Vrací výsledky i zvlášť, protože uložení hned po překladu nemůže čekat na
   * to, až React promítne stav.
   */
  async function translate(targets: string[]) {
    const source = form.translations[defaultLocale]
    const results: Record<string, Translation> = {}
    const failed: string[] = []

    setTranslating(true)
    setStatus(Object.fromEntries(targets.map((code) => [code, 'working' as const])))
    const toastId = toast.loading(`Překládám do ${targets.length} jazyků…`)

    let done = 0
    // Všechny jazyky naráz - každý dorazí, jakmile je hotový.
    await Promise.all(targets.map(async (code) => {
      const result = await requestTranslation(code, source)
      done += 1

      if (!result.ok) {
        failed.push(code)
        setStatus((previous) => ({ ...previous, [code]: 'error' }))
        if (failed.length === 1) toast.error(result.error)
      } else {
        const translation = { ...emptyTranslation, ...result.translation }
        results[code] = translation
        setForm((previous) => ({
          ...previous,
          translations: { ...previous.translations, [code]: translation },
        }))
        setStatus((previous) => {
          const next = { ...previous }
          delete next[code]
          return next
        })
      }

      toast.loading(`Překládám… ${done}/${targets.length}`, { id: toastId })
    }))

    setTranslating(false)

    if (failed.length === 0) {
      toast.success(`Přeloženo do ${targets.length} jazyků. Zkontroluj a ulož.`, { id: toastId })
    } else {
      toast.warning(
        `Nepřeloženo: ${failed.map((code) => code.toUpperCase()).join(', ')}. Zkus to znovu.`,
        { id: toastId },
      )
    }

    return results
  }

  function handleTranslate(targets: string[]) {
    setConfirmRetranslate(false)
    if (!czechReady) {
      toast.error('Nejdřív vyplň český název.')
      setLocale(defaultLocale)
      return
    }
    void translate(targets)
  }

  function handleSubmit() {
    // Stará hodnota by se při uložení tiše zahodila; ať o ní admin ví.
    if (legacyIndustry) {
      toast.error(`Obor „${legacyIndustry}" už není v seznamu - vyber nový.`)
      return
    }

    startTransition(async () => {
      let translations = form.translations

      // „Vyplním češtinu a uložím": chybějící jazyky se doplní před uložením.
      // Selhání překladu uložení nezastaví - chybějící jazyk prostě dál
      // spadne na češtinu, jako dosud.
      if (autoTranslate && canTranslate && czechReady && missingLocales.length > 0) {
        const results = await translate(missingLocales)
        translations = { ...translations, ...results }
      }

      const result = await saveReference({
        id: form.id,
        slug: form.slug.trim(),
        clientName: form.clientName.trim(),
        year: form.year ? Number(form.year) : null,
        industry: isIndustryKey(form.industry) ? form.industry : null,
        coverImage: form.coverImage,
        projectUrl: form.projectUrl.trim() || null,
        tech: form.tech
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        sortOrder: Number(form.sortOrder) || 0,
        published: form.published,
        featured: form.featured,
        noindex: form.noindex,
        translations,
      })

      if (!result.ok) {
        toast.error(result.error ?? 'Uložení selhalo.')
        return
      }

      toast.success('Reference uložena.')
      onOpenChange(false)
      onSaved()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Upravit referenci' : 'Nová reference'}</DialogTitle>
          <DialogDescription>
            {canTranslate
              ? 'Stačí vyplnit češtinu - ostatní jazyky se přeloží automaticky.'
              : 'Čeština je povinná - ostatní jazyky se na ni odkazují, když překlad chybí.'}
          </DialogDescription>
        </DialogHeader>

        <fieldset disabled={translating} className="space-y-6 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">Klient *</Label>
              <Input
                id="clientName"
                value={form.clientName}
                onChange={(event) => setField('clientName', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (v URL) *</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(event) => setField('slug', event.target.value)}
                  placeholder="nazev-projektu"
                />
                <Button
                  type="button"
                  variant="outline"
                  // Generated from the Czech title, never automatically on
                  // edit: changing a slug breaks links that already exist.
                  onClick={() => setField('slug', slugify(form.translations[defaultLocale].title))}
                >
                  Z názvu
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Rok</Label>
              <Input
                id="year"
                type="number"
                value={form.year}
                onChange={(event) => setField('year', event.target.value)}
                placeholder="2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Obor</Label>
              <Select
                value={legacyIndustry ? undefined : form.industry || NO_INDUSTRY}
                onValueChange={(value) => setField('industry', value === NO_INDUSTRY ? '' : value)}
              >
                <SelectTrigger id="industry" className="w-full">
                  <SelectValue placeholder="Vyber obor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_INDUSTRY}>Bez oboru</SelectItem>
                  {industryOptions.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {legacyIndustry && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Původní hodnota „{legacyIndustry}" není v seznamu - vyber obor.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Přeloží se sám a na portfoliu určuje barvu bubliny.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="projectUrl">Odkaz na projekt</Label>
              <Input
                id="projectUrl"
                value={form.projectUrl}
                onChange={(event) => setField('projectUrl', event.target.value)}
                placeholder="https://…"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tech">Technologie (oddělené čárkou)</Label>
              <Input
                id="tech"
                value={form.tech}
                onChange={(event) => setField('tech', event.target.value)}
                placeholder="Next.js, PostgreSQL, TypeScript"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Úvodní obrázek</Label>
              <ImageField
                value={form.coverImage}
                onChange={(url) => setField('coverImage', url)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 border-y border-border py-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.published}
                onCheckedChange={(checked) => setField('published', checked)}
              />
              Publikovat
            </label>

            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.featured}
                onCheckedChange={(checked) => setField('featured', checked)}
              />
              Zvýraznit (nahoře)
            </label>

            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.noindex}
                onCheckedChange={(checked) => setField('noindex', checked)}
              />
              Skrýt před vyhledávači
              <span className="text-xs text-muted-foreground">(na webu zůstane)</span>
            </label>
          </div>

          {canTranslate && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <Sparkle weight="fill" className="text-primary" />
                    Překlady z češtiny
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {missingLocales.length === 0
                      ? 'Všechny jazyky jsou vyplněné.'
                      : `Chybí ${missingLocales.length} z ${otherLocales.length} jazyků.`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {missingLocales.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleTranslate(missingLocales)}
                      disabled={translating || pending}
                    >
                      {translating ? 'Překládám…' : `Doplnit chybějící (${missingLocales.length})`}
                    </Button>
                  )}

                  {/* Přepíše i ručně upravené jazyky, proto potvrzení přímo
                      na místě - druhé modální okno nad formulářem by
                      zdržovalo víc, než kolik chrání. */}
                  {missingLocales.length < otherLocales.length &&
                    (confirmRetranslate ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleTranslate(otherLocales)}
                          disabled={translating || pending}
                        >
                          Ano, přepsat všech {otherLocales.length}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmRetranslate(false)}
                        >
                          Zpět
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRetranslate(true)}
                        disabled={translating || pending}
                      >
                        Přeložit vše znovu
                      </Button>
                    ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Switch checked={autoTranslate} onCheckedChange={setAutoTranslate} />
                Při uložení automaticky doplnit chybějící jazyky
              </label>
            </div>
          )}

          <Tabs value={locale} onValueChange={setLocale}>
            <TabsList className="flex w-full flex-wrap">
              {locales.map((code) => {
                const filled = Boolean(form.translations[code].title.trim())
                const state = status[code]

                return (
                  <TabsTrigger key={code} value={code} className="relative gap-1">
                    {languages[code].flag}
                    <span className="uppercase">{code}</span>
                    {/* A dot rather than a word: twelve tabs with "chybí"
                        written out would not fit on a laptop. */}
                    <span
                      aria-label={
                        state === 'working'
                          ? 'překládá se'
                          : state === 'error'
                            ? 'překlad selhal'
                            : filled
                              ? 'přeloženo'
                              : 'chybí překlad'
                      }
                      className={
                        state === 'working'
                          ? 'size-1.5 animate-pulse rounded-full bg-amber-500'
                          : state === 'error'
                            ? 'size-1.5 rounded-full bg-destructive'
                            : filled
                              ? 'size-1.5 rounded-full bg-emerald-500'
                              : 'size-1.5 rounded-full bg-muted-foreground/40'
                      }
                    />
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <TabsContent value={locale} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Název {locale === defaultLocale && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="title"
                  value={current.title}
                  onChange={(event) => setTranslation('title', event.target.value)}
                />
                {locale !== defaultLocale && (
                  <p className="text-xs text-muted-foreground">
                    Prázdný název = tenhle jazyk se smaže a použije se čeština.
                    {canTranslate && ' Překlad z češtiny jde doplnit tlačítkem nahoře.'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Perex</Label>
                <Textarea
                  id="summary"
                  rows={2}
                  value={current.summary}
                  onChange={(event) => setTranslation('summary', event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Case study (Markdown)</Label>
                <Textarea
                  id="body"
                  rows={10}
                  className="font-mono text-sm"
                  value={current.body}
                  onChange={(event) => setTranslation('body', event.target.value)}
                  placeholder={'## Zadání\n\n…'}
                />
              </div>

              <SeoFields
                locale={locale}
                slug={form.slug}
                fallbackTitle={current.title}
                fallbackDescription={current.summary}
                metaTitle={current.metaTitle}
                metaDescription={current.metaDescription}
                onChange={setTranslation}
              />

              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="testimonial">Citace klienta</Label>
                  <Textarea
                    id="testimonial"
                    rows={2}
                    value={current.testimonial}
                    onChange={(event) => setTranslation('testimonial', event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testimonialAuthor">Autor citace</Label>
                  <Input
                    id="testimonialAuthor"
                    value={current.testimonialAuthor}
                    onChange={(event) => setTranslation('testimonialAuthor', event.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </fieldset>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending || translating}
          >
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={pending || translating}>
            {translating ? 'Překládám…' : pending ? 'Ukládám…' : 'Uložit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
