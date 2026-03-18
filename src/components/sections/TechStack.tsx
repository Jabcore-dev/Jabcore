'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import TechIcon from '@/components/TechIcon'
import { useTranslation } from 'react-i18next'

export default function TechStack() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { t } = useTranslation()

  const techCategories = [
    {
      title: t('techStack.categories.frontend.title'),
      description: t('techStack.categories.frontend.description'),
      technologies: [
        'React',
        'TypeScript',
        'JavaScript',
        'Vue.js',
      ],
    },
    {
      title: t('techStack.categories.backend.title'),
      description: t('techStack.categories.backend.description'),
      technologies: [
        'Node.js',
        'Python',
        'C#',
      ],
    },
    {
      title: t('techStack.categories.mobile.title'),
      description: t('techStack.categories.mobile.description'),
      technologies: [
        'React',
        'Swift',
        'Kotlin',
        'iOS',
        'Android',
        'Capacitor JS',
      ],
    },
    {
      title: t('techStack.categories.cloud.title'),
      description: t('techStack.categories.cloud.description'),
      technologies: [
        'Azure',
        'Docker',
        'Git',
        'CI/CD',
        'Ubuntu Server',
      ],
    },
    {
      title: t('techStack.categories.ai.title'),
      description: t('techStack.categories.ai.description'),
      technologies: [
        'OpenAI',
        'Gemini',
        'Claude',
      ],
    },
    {
      title: t('techStack.categories.design.title'),
      description: t('techStack.categories.design.description'),
      technologies: [
        'Figma',
        'Web Design',
        'Prototyping',
        'User Testing',
      ],
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
          <h2 className="text-4xl sm:text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            {t('techStack.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('techStack.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {techCategories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    {category.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {category.technologies.map((tech) => (
                      <div
                        key={tech}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-150 group"
                      >
                        <TechIcon name={tech} className="w-5 h-5 group-hover:scale-105 transition-transform duration-150" />
                        <span className="text-sm font-medium text-foreground/80">{tech}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="p-8 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-2 max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed">
              <span className="text-foreground font-semibold">{t('techStack.notSeeingYourTech')}</span> {t('techStack.notSeeingDesc')}
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}