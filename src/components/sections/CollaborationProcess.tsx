'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { 
  ChatCircleDots, 
  Handshake, 
  FileText, 
  RocketLaunch, 
  PaintBrush, 
  CheckCircle,
  ArrowRight
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

export default function CollaborationProcess() {
  const { t } = useTranslation()

  const steps = [
    {
      number: t('collaboration.steps.inquiry.number'),
      title: t('collaboration.steps.inquiry.title'),
      description: t('collaboration.steps.inquiry.description'),
      icon: ChatCircleDots,
    },
    {
      number: t('collaboration.steps.discovery.number'),
      title: t('collaboration.steps.discovery.title'),
      description: t('collaboration.steps.discovery.description'),
      icon: Handshake,
    },
    {
      number: t('collaboration.steps.proposal.number'),
      title: t('collaboration.steps.proposal.title'),
      description: t('collaboration.steps.proposal.description'),
      icon: FileText,
    },
    {
      number: t('collaboration.steps.kickoff.number'),
      title: t('collaboration.steps.kickoff.title'),
      description: t('collaboration.steps.kickoff.description'),
      icon: RocketLaunch,
    },
    {
      number: t('collaboration.steps.prototype.number'),
      title: t('collaboration.steps.prototype.title'),
      description: t('collaboration.steps.prototype.description'),
      icon: PaintBrush,
    },
    {
      number: t('collaboration.steps.delivery.number'),
      title: t('collaboration.steps.delivery.title'),
      description: t('collaboration.steps.delivery.description'),
      icon: CheckCircle,
    },
  ]
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            {t('collaboration.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('collaboration.subtitle')}
          </p>
          <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed mt-4 italic">
            {t('collaboration.note')}
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 sm:p-8 hover:shadow-lg transition-all duration-300 border-2">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-primary" weight="regular" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <span className="text-5xl font-bold text-primary/20" style={{ fontFamily: 'var(--font-display)' }}>
                          {step.number}
                        </span>
                        <div className="text-2xl font-semibold flex-1 pt-2" style={{ fontFamily: 'var(--font-display)' }}>
                          {step.title}
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <Card className="p-8 sm:p-12 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-2">
            <div className="flex items-center justify-center gap-3 mb-4">
              <ArrowRight className="w-6 h-6 text-accent" weight="bold" />
              <div className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                {t('collaboration.afterLaunch')}
              </div>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
              {t('collaboration.afterLaunchDesc')}
            </p>
            <p className="text-lg font-medium text-foreground max-w-3xl mx-auto leading-relaxed">
              {t('collaboration.longTerm')}
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}