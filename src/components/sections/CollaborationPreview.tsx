'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useLocalePath } from '@/hooks/useLocale'
import { 
  ChatCircleDots, 
  Handshake, 
  FileText, 
  RocketLaunch, 
  PaintBrush, 
  CheckCircle,
  ArrowRight
} from '@phosphor-icons/react'

const steps = [
  {
    number: '01',
    title: 'Initial Inquiry',
    icon: ChatCircleDots,
  },
  {
    number: '02',
    title: 'Discovery Meeting',
    icon: Handshake,
  },
  {
    number: '03',
    title: 'Proposal & Design',
    icon: FileText,
  },
  {
    number: '04',
    title: 'Development Kickoff',
    icon: RocketLaunch,
  },
  {
    number: '05',
    title: 'First Prototype',
    icon: PaintBrush,
  },
  {
    number: '06',
    title: 'Final Delivery',
    icon: CheckCircle,
  },
]

export default function CollaborationPreview() {
  const localePath = useLocalePath()

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            How We Work Together
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A transparent, collaborative process from first contact to final delivery.
          </p>
          <p className="text-sm text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed mt-3 italic">
            Note: The specific process and timeline depend on your unique project requirements.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 h-full">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" weight="regular" />
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-primary/30 block mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                          {step.number}
                        </span>
                        <h3 className="text-sm sm:text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                          {step.title}
                        </h3>
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
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <Link href={localePath('/about')}>
              <Button size="lg" className="gap-2 group">
                See Our Full Process
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}