'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkle } from '@phosphor-icons/react'
import Link from 'next/link'
import { useState } from 'react'
import ContactModal from '@/components/ContactModal'
import { useTranslation } from 'react-i18next'

interface CTAProps {
  variant?: 'default' | 'services'
}

export default function CTA({ variant = 'default' }: CTAProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const { t } = useTranslation()
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />
      
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="inline-flex items-center justify-center gap-2 mb-6 px-6 py-3 rounded-full bg-primary/10 border border-primary/20"
          >
            <Sparkle className="w-5 h-5 text-primary" weight="fill" />
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              {t('cta.badge')}
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 gradient-text" style={{ fontFamily: 'var(--font-display)' }}>
            {t('cta.title')}
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
            {t('cta.description')}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground group px-10 py-7 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={() => setIsContactModalOpen(true)}
            >
              {t('cta.startProject')}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" weight="bold" />
            </Button>
            {variant === 'default' ? (
              <Link href="/services">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 px-10 py-7 text-lg font-semibold hover:bg-accent/10 transition-all duration-300"
                >
                  {t('cta.exploreServices')}
                </Button>
              </Link>
            ) : (
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 px-10 py-7 text-lg font-semibold hover:bg-accent/10 transition-all duration-300"
                >
                  {t('cta.learnAboutUs')}
                </Button>
              </Link>
            )}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm text-muted-foreground mt-8"
          >
            {t('cta.note')}
          </motion.p>
        </motion.div>
      </div>

      <ContactModal open={isContactModalOpen} onOpenChange={setIsContactModalOpen} />
    </section>
  )
}