'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DeviceMobile, Database, Globe, Layout, ArrowRight } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useLocalePath } from '@/hooks/useLocale'

export default function ServicesPreview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useTranslation()
  const localePath = useLocalePath()

  const services = [
    {
      icon: DeviceMobile,
      title: t('services.mobile.title'),
      description: t('servicesPreview.mobileDesc'),
    },
    {
      icon: Database,
      title: t('services.enterprise.title'),
      description: t('servicesPreview.enterpriseDesc'),
    },
    {
      icon: Globe,
      title: t('services.web.title'),
      description: t('servicesPreview.webDesc'),
    },
    {
      icon: Layout,
      title: t('services.websites.title'),
      description: t('servicesPreview.websitesDesc'),
    },
  ]

  return (
    <section ref={ref} className="py-24 sm:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            {t('servicesPreview.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('servicesPreview.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50 group">
                  <CardHeader>
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-7 h-7 text-primary" weight="duotone" />
                    </div>
                    <CardTitle className="text-xl mb-3">{service.title}</CardTitle>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </CardHeader>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Link href={localePath('/services')}>
            <Button size="lg" className="group">
              {t('servicesPreview.exploreAll')}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}