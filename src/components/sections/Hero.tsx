'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Code, DeviceMobile, Database } from '@phosphor-icons/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import ContactModal from '@/components/ContactModal'
import { useTranslation } from 'react-i18next'

type Dot = {
  left: number
  top: number
  duration: number
  delay: number
}

export default function Hero() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const { t } = useTranslation()
  const [dots, setDots] = useState<Dot[]>([])

  useEffect(() => {
    setDots(
      Array.from({ length: 30 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 4 + Math.random() * 3,
        delay: Math.random() * 3,
      }))
    )
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      <div className="absolute inset-0 overflow-hidden opacity-40 md:opacity-40">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0 overflow-hidden hidden md:block">
        {dots.map((dot, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-accent/40 rounded-full"
            style={{
              left: `${dot.left}%`,
              top: `${dot.top}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.1, 0.6, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: dot.duration,
              repeat: Infinity,
              delay: dot.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="absolute top-20 left-10 opacity-20 hidden md:block">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <Code className="w-16 h-16 text-primary" weight="duotone" />
        </motion.div>
      </div>

      <div className="absolute bottom-32 right-16 opacity-20 hidden md:block">
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <DeviceMobile className="w-20 h-20 text-accent" weight="duotone" />
        </motion.div>
      </div>

      <div className="absolute top-1/3 right-1/4 opacity-20 hidden md:block">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Database className="w-14 h-14 text-primary" weight="duotone" />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center gap-2 mb-8 px-6 py-3 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-sm"
          >
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">
              {t('hero.badge')}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 gradient-text leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground/90 mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-medium"
          >
            {t('hero.description')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-16"
          >
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground group px-10 py-7 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={() => setIsContactModalOpen(true)}
            >
              {t('hero.getInTouch')}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" weight="bold" />
            </Button>
            <Link href="/services">
              <Button
                size="lg"
                variant="outline"
                className="border-2 px-10 py-7 text-lg font-semibold hover:bg-accent/10 transition-all duration-300"
              >
                {t('hero.viewServices')}
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 sm:gap-12 text-sm text-muted-foreground"
          >
            {[
              t('hero.features.mobileWeb'),
              t('hero.features.ai'),
              t('hero.features.enterprise'),
              t('hero.features.cloud')
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="font-medium">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-foreground/20 rounded-full flex items-start justify-center p-2"
        >
          <motion.div 
            className="w-1.5 h-1.5 bg-foreground/30 rounded-full"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>

      <ContactModal open={isContactModalOpen} onOpenChange={setIsContactModalOpen} />
    </section>
  )
}