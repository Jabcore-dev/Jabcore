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
import { locales, defaultLocale, languages } from '@/lib/i18n-config'
import { saveReference } from '@/app/admin/actions/references'
import type { AdminReference } from '@/lib/admin-data'
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
  open,
  onOpenChange,
  onSaved,
}: {
  reference: AdminReference | null
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

  function handleSubmit() {
    startTransition(async () => {
      const result = await saveReference({
        id: form.id,
        slug: form.slug.trim(),
        clientName: form.clientName.trim(),
        year: form.year ? Number(form.year) : null,
        industry: form.industry.trim() || null,
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
        translations: form.translations,
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
            Čeština je povinná - ostatní jazyky se na ni odkazují, když překlad chybí.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
              <Label htmlFor="industry">Obor (klíč pro filtr)</Label>
              <Input
                id="industry"
                value={form.industry}
                onChange={(event) => setField('industry', event.target.value)}
                placeholder="verejna-sprava"
              />
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

          <Tabs value={locale} onValueChange={setLocale}>
            <TabsList className="flex w-full flex-wrap">
              {locales.map((code) => {
                const filled = Boolean(form.translations[code].title.trim())

                return (
                  <TabsTrigger key={code} value={code} className="relative gap-1">
                    {languages[code].flag}
                    <span className="uppercase">{code}</span>
                    {/* A dot rather than a word: twelve tabs with "chybí"
                        written out would not fit on a laptop. */}
                    <span
                      aria-label={filled ? 'přeloženo' : 'chybí překlad'}
                      className={
                        filled
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? 'Ukládám…' : 'Uložit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
