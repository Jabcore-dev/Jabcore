'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, useFormField } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PaperPlaneRight } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { sendContactEmail } from '@/lib/emailjs'
import { cn } from '@/lib/utils'

// Renders the error message translated via i18n — error.message stores the i18n key
function TranslatedFormMessage({ className }: { className?: string }) {
  const { error, formMessageId } = useFormField()
  const { t } = useTranslation()
  if (!error?.message) return null
  return (
    <p id={formMessageId} className={cn('text-destructive text-sm', className)}>
      {t(error.message)}
    </p>
  )
}

const phoneCountries = [
  { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
  { code: '+421', country: 'Slovakia', flag: '🇸🇰' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+36', country: 'Hungary', flag: '🇭🇺' },
  { code: '+40', country: 'Romania', flag: '🇷🇴' },
]

interface ContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormData = {
  name: string
  email: string
  phonePrefix: string
  phoneNumber: string
  message: string
  company?: string
}

// i18n keys as error messages — translated at render time by TranslatedFormMessage
const formSchema = z.object({
  name: z.string().min(2, 'contact.validation.nameMin'),
  email: z.string().email('contact.validation.emailInvalid'),
  phonePrefix: z.string().min(1, 'contact.validation.phoneCodeRequired'),
  phoneNumber: z.string()
    .min(6, 'contact.validation.phoneMin')
    .regex(/^[0-9]+$/, 'contact.validation.phoneDigitsOnly'),
  message: z.string().min(10, 'contact.validation.messageMin'),
  company: z.string().optional(),
})

export default function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t, i18n } = useTranslation()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phonePrefix: t('contact.phonePrefix'),
      phoneNumber: '',
      message: '',
      company: '',
    },
  })

  useEffect(() => {
    form.setValue('phonePrefix', t('contact.phonePrefix'))
  }, [i18n.language, form, t])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    const success = await sendContactEmail({
      name: data.name,
      email: data.email,
      company: data.company,
      phone: `${data.phonePrefix} ${data.phoneNumber}`,
      message: data.message,
      language: i18n.language,
    })

    if (success) {
      toast.success(t('contact.successTitle'), {
        description: t('contact.successDesc'),
      })
      form.reset()
      onOpenChange(false)
    } else {
      toast.error(t('contact.errorTitle'), {
        description: t('contact.errorDesc'),
      })
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-2xl">{t('contact.formTitle')}</DialogTitle>
          <DialogDescription>
            {t('contact.formDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.name')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('contact.namePlaceholder')}
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <TranslatedFormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.email')} *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('contact.emailPlaceholder')}
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <TranslatedFormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.company')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('contact.companyPlaceholder')}
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <TranslatedFormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4">
              <FormField
                control={form.control}
                name="phonePrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.country')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={t('contact.phoneCodePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {phoneCountries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="flex items-center gap-2">
                              <span>{country.flag}</span>
                              <span>{country.code}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <TranslatedFormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.phoneNumber')} *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={t('contact.phoneNumberPlaceholder')}
                        {...field}
                        className="h-12"
                      />
                    </FormControl>
                    <TranslatedFormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.message')} *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('contact.messagePlaceholder')}
                      className="min-h-[150px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <TranslatedFormMessage />
                </FormItem>
              )}
            />

            </div>

            <div className="px-6 py-4 border-t shrink-0">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-pulse">{t('contact.sending')}</span>
                  </>
                ) : (
                  <>
                    {t('contact.sendMessage')}
                    <PaperPlaneRight className="ml-2" weight="bold" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
