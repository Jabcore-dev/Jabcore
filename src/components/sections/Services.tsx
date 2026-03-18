'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeviceMobile, Database, Globe, Layout, CheckCircle, Sparkle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

export default function Services() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useTranslation()

  const services = [
    {
      icon: DeviceMobile,
      title: t('services.mobile.title'),
      description: t('services.mobile.description'),
      features: t('services.mobile.features', { returnObjects: true }) as string[],
      highlights: t('services.mobile.highlights', { returnObjects: true }) as string[],
    },
    {
      icon: Database,
      title: t('services.enterprise.title'),
      description: t('services.enterprise.description'),
      features: t('services.enterprise.features', { returnObjects: true }) as string[],
      highlights: t('services.enterprise.highlights', { returnObjects: true }) as string[],
    },
    {
      icon: Globe,
      title: t('services.web.title'),
      description: t('services.web.description'),
      features: t('services.web.features', { returnObjects: true }) as string[],
      highlights: t('services.web.highlights', { returnObjects: true }) as string[],
    },
    {
      icon: Layout,
      title: t('services.websites.title'),
      description: t('services.websites.description'),
      features: t('services.websites.features', { returnObjects: true }) as string[],
      highlights: t('services.websites.highlights', { returnObjects: true }) as string[],
    },
  ]

  return (
    <section ref={ref} className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl sm:text-6xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            {t('services.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('services.subtitle')}
          </p>
        </motion.div>

        <div className="space-y-24">
          {services.map((service, index) => {
            const Icon = service.icon
            const isEven = index % 2 === 0
            
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: index * 0.15 }}
              >
                <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                  <div className={`grid lg:grid-cols-2 gap-8 ${isEven ? '' : 'lg:grid-flow-dense'}`}>
                    <CardHeader className={`lg:p-12 ${isEven ? '' : 'lg:col-start-2'}`}>
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-9 h-9 text-primary" weight="duotone" />
                        </div>
                        <div>
                          <CardTitle className="text-3xl mb-3">{service.title}</CardTitle>
                          <div className="flex flex-wrap gap-2">
                            {service.highlights.map((highlight) => (
                              <Badge key={highlight} variant="secondary" className="text-xs">
                                <Sparkle className="w-3 h-3 mr-1" weight="fill" />
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-base text-muted-foreground leading-relaxed mb-6">
                        {service.description}
                      </p>
                    </CardHeader>
                    
                    <CardContent className={`lg:p-12 pt-0 lg:pt-12 bg-secondary/20 ${isEven ? '' : 'lg:col-start-1 lg:row-start-1'}`}>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary" weight="fill" />
                        {t('services.whatsIncluded')}
                      </h3>
                      <ul className="grid gap-3">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-sm">
                            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" weight="duotone" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}