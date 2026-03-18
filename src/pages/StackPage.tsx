'use client'
import { motion } from 'framer-motion'
import { 
  Cube, 
  Code, 
  Database, 
  DeviceMobile, 
  Brain, 
  Cloud, 
  PencilLine,
  CheckCircle
} from '@phosphor-icons/react'
import TechIcon from '@/components/TechIcon'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import ContactModal from '@/components/ContactModal'
import { useSEO } from '@/hooks/useSEO'

export default function StackPage() {
  const { t } = useTranslation()
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  
  useSEO({ page: 'stack', url: 'https://jabcore.cz/stack' })
  
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  }

  const technologies = [
    {
      icon: Cube,
      title: t('stack.technologies.solutionArchitecture.title'),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      description: t('stack.technologies.solutionArchitecture.description'),
      features: t('stack.technologies.solutionArchitecture.features', { returnObjects: true }) as string[],
      techs: []
    },
    {
      icon: Code,
      title: t('stack.technologies.frontendDev.title'),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      description: t('stack.technologies.frontendDev.description'),
      features: [],
      techs: [
        { name: 'TypeScript' },
        { name: 'JavaScript' },
        { name: 'React' },
        { name: 'Vue.js' }
      ]
    },
    {
      icon: Database,
      title: t('stack.technologies.backendDev.title'),
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      description: t('stack.technologies.backendDev.description'),
      features: [],
      techs: [
        { name: 'Python' },
        { name: 'TypeScript' },
        { name: 'Node.js' },
        { name: 'C#' }
      ]
    },
    {
      icon: DeviceMobile,
      title: t('stack.technologies.mobileApps.title'),
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      description: t('stack.technologies.mobileApps.description'),
      features: t('stack.technologies.mobileApps.features', { returnObjects: true }) as string[],
      techs: [
        { name: 'iOS' },
        { name: 'Android' },
        { name: 'Capacitor JS' },
        { name: 'Swift' },
        { name: 'Kotlin' }
      ]
    },
    {
      icon: Brain,
      title: t('stack.technologies.aiIntegration.title'),
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      description: t('stack.technologies.aiIntegration.description'),
      features: [],
      techs: [
        { name: 'n8n' },
        { name: 'OpenAI' },
        { name: 'Gemini' },
        { name: 'Claude' }
      ]
    },
    {
      icon: Cloud,
      title: t('stack.technologies.cloudInfra.title'),
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      description: t('stack.technologies.cloudInfra.description'),
      features: [],
      techs: [
        { name: 'Ubuntu Server' },
        { name: 'Azure' },
        { name: 'Git' },
        { name: 'Docker' },
        { name: 'CI/CD' }
      ]
    },
    {
      icon: PencilLine,
      title: t('stack.technologies.uxui.title'),
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      description: t('stack.technologies.uxui.description'),
      features: [],
      techs: [
        { name: 'Figma' },
        { name: 'Web Design' },
        { name: 'Prototyping' },
        { name: 'User Testing' }
      ]
    }
  ]

  return (
    <div className="min-h-screen pt-16">
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
              {t('stack.title').split(' ').slice(0, -2).join(' ')} <span className="gradient-text">{t('stack.title').split(' ').slice(-2).join(' ')}</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('stack.subtitle')}
            </p>
          </motion.div>

          <div className="grid gap-8 lg:gap-12">
            {technologies.map((tech, index) => {
              const Icon = tech.icon
              return (
                <motion.div
                  key={tech.title}
                  {...fadeInUp}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-card border border-border rounded-2xl p-8 lg:p-12 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                    <div className="flex flex-col lg:flex-row gap-8">
                      <div className="flex-shrink-0">
                        <div className={`${tech.bgColor} ${tech.color} w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-8 h-8" weight="duotone" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h2 className="text-2xl lg:text-3xl font-display font-bold mb-4">
                          {tech.title}
                        </h2>
                        <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                          {tech.description}
                        </p>

                        {tech.features.length > 0 && (
                          <div className="mb-6">
                            <div className="grid sm:grid-cols-2 gap-3">
                              {tech.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <CheckCircle className={`${tech.color} w-5 h-5 flex-shrink-0 mt-0.5`} weight="fill" />
                                  <span className="text-sm text-foreground/80">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {tech.techs.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {tech.techs.map((item, idx) => (
                              <motion.div
                                key={idx}
                                whileHover={{ scale: 1.05, y: -2 }}
                                className="bg-secondary/50 hover:bg-secondary px-4 py-2 rounded-lg flex items-center gap-2 border border-border/50 hover:border-primary/30 transition-all duration-200"
                              >
                                <TechIcon name={item.name} className="w-5 h-5" />
                                <span className="font-medium text-sm">{item.name}</span>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-20 text-center"
          >
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-12">
              <h3 className="text-3xl font-display font-bold mb-4">
                {t('stack.readyToBuild')}
              </h3>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                {t('stack.readyDesc')}
              </p>
              <motion.button
                onClick={() => setIsContactModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                {t('stack.getStarted')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <ContactModal open={isContactModalOpen} onOpenChange={setIsContactModalOpen} />
    </div>
  )
}
