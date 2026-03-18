'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PaperPlaneRight } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { sendContactEmail } from '@/lib/emailjs'

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phonePrefix: z.string().min(1, 'Please select a country code'),
  phoneNumber: z.string().min(6, 'Phone number must be at least 6 digits').regex(/^[0-9]+$/, 'Phone number must contain only digits'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  company: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

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

  // Update phonePrefix when language changes
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('contact.formTitle')}</DialogTitle>
          <DialogDescription>
            {t('contact.formDesc')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.name')} *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe" 
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <FormMessage />
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
                      placeholder="john@example.com" 
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <FormMessage />
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
                      placeholder="Acme Corporation" 
                      {...field}
                      className="h-12"
                    />
                  </FormControl>
                  <FormMessage />
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
                          <SelectValue placeholder="Code" />
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
                    <FormMessage />
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
                        placeholder="123456789" 
                        {...field}
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />

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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}