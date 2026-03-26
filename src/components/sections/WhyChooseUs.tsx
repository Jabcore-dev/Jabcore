'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Lightning, 
  ShieldCheck, 
  ChartLine, 
  Users, 
  Headset,
  BracketsAngle,
  Clock
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

export default function WhyChooseUs() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useTranslation()

  const reasons = [
    {
      icon: Lightning,
      title: t('whyChooseUs.reasons.speed.title'),
      description: t('whyChooseUs.reasons.speed.description'),
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: ShieldCheck,
      title: t('whyChooseUs.reasons.security.title'),
      description: t('whyChooseUs.reasons.security.description'),
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: ChartLine,
      title: t('whyChooseUs.reasons.scalability.title'),
      description: t('whyChooseUs.reasons.scalability.description'),
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: BracketsAngle,
      title: t('whyChooseUs.reasons.code.title'),
      description: t('whyChooseUs.reasons.code.description'),
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Users,
      title: t('whyChooseUs.reasons.design.title'),
      description: t('whyChooseUs.reasons.design.description'),
      gradient: 'from-red-500 to-rose-500',
    },
    {
      icon: Headset,
      title: t('whyChooseUs.reasons.support.title'),
      description: t('whyChooseUs.reasons.support.description'),
      gradient: 'from-indigo-500 to-violet-500',
    },
    {
      icon: Clock,
      title: t('whyChooseUs.reasons.communication.title'),
      description: t('whyChooseUs.reasons.communication.description'),
      gradient: 'from-teal-500 to-cyan-500',
    },
  ]

  return (
    <section ref={ref} className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            {t('whyChooseUs.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('whyChooseUs.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {reasons.slice(0, 3).map((reason, index) => {
            const Icon = reason.icon
            return (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-300 group border-2 hover:border-primary/40 relative overflow-hidden bg-card/50 backdrop-blur-sm">
                  <div className={`absolute inset-0 bg-gradient-to-br ${reason.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300`} />
                  <CardContent className="pt-8 pb-8 px-6 relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${reason.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="w-8 h-8 text-white" weight="duotone" />
                    </div>
                    <div className="font-bold text-xl mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                      {reason.title}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {reason.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mt-8">
          {reasons.slice(3).map((reason, index) => {
            const Icon = reason.icon
            return (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: (index + 3) * 0.08 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-300 group border-2 hover:border-primary/40 relative overflow-hidden bg-card/50 backdrop-blur-sm">
                  <div className={`absolute inset-0 bg-gradient-to-br ${reason.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300`} />
                  <CardContent className="pt-8 pb-8 px-6 relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${reason.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="w-8 h-8 text-white" weight="duotone" />
                    </div>
                    <div className="font-bold text-xl mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                      {reason.title}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {reason.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}