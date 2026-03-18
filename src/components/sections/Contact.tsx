'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { PaperPlaneRight, EnvelopeSimple, Phone, MapPin, Clock, Copy, Check } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().optional(),
  phonePrefix: z.string().min(1, 'Please select a country code'),
  phoneNumber: z.string().min(6, 'Phone number must be at least 6 digits').regex(/^[0-9]+$/, 'Phone number must contain only digits'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
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

export default function Contact() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const { t, i18n } = useTranslation()

  const contactInfo = [
    {
      icon: EnvelopeSimple,
      label: t('contact.generalInquiries'),
      value: 'info@jabcore.cz',
      href: 'mailto:info@jabcore.cz',
      description: t('contact.generalDesc'),
    },
    {
      icon: EnvelopeSimple,
      label: t('contact.devTeam'),
      value: 'dev@jabcore.cz',
      href: 'mailto:dev@jabcore.cz',
      description: t('contact.devTeamDesc'),
    },
    {
      icon: Phone,
      label: t('contact.phone'),
      value: t('contact.phoneValue'),
      href: `tel:${t('contact.phoneValue').replace(/\s/g, '')}`,
      description: t('contact.phoneDesc'),
    },
  ]

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phonePrefix: t('contact.phonePrefix'),
      phoneNumber: '',
      message: '',
    },
  })

  // Update phonePrefix when language changes
  useEffect(() => {
    form.setValue('phonePrefix', t('contact.phonePrefix'))
  }, [i18n.language, form, t])

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success('Message sent successfully!', {
      description: "We'll respond within 24 hours to discuss your project.",
    })
    
    form.reset()
    setIsSubmitting(false)
  }

  return (
    <section ref={ref} className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {t('contact.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-5xl mx-auto mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <Card className="border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300 h-full group">
                    <CardContent className="pt-6 pb-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Icon size={28} className="text-primary" weight="bold" />
                        </div>
                        <h3 className="font-semibold mb-1 text-sm text-muted-foreground uppercase tracking-wide">
                          {info.label}
                        </h3>
                        <a 
                          href={info.href}
                          className="text-foreground hover:text-primary transition-colors font-semibold text-lg mb-2 break-all"
                        >
                          {info.value}
                        </a>
                        <p className="text-sm text-muted-foreground mb-3">
                          {info.description}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(info.value, index)}
                          className="gap-2"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={16} weight="bold" />
                              {t('contact.copied')}
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              {t('contact.copy')}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="max-w-5xl mx-auto mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 bg-gradient-to-br from-card to-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} className="text-primary" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-lg">{t('contact.ourLocation')}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('contact.locationDesc')}<br />
                      <span className="text-sm">{t('contact.locationNote')}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-card to-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={24} className="text-primary" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-lg">{t('contact.businessHours')}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('contact.businessHoursDesc')}<br />
                      <span className="text-sm">{t('contact.businessHoursNote')}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl">{t('contact.formTitle')}</CardTitle>
              <CardDescription className="text-base">
                {t('contact.formDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}