'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Rocket, Sparkle } from '@phosphor-icons/react'

const products = [
  {
    icon: Lightbulb,
    title: 'TaskFlow AI',
    description: 'Intelligent task management platform powered by machine learning that learns from your team\'s workflow patterns and suggests optimal scheduling. Designed to boost productivity by 40% through smart prioritization and automated delegation.',
    status: 'Coming Q3 2024',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Rocket,
    title: 'DevPulse',
    description: 'Real-time development analytics dashboard for modern engineering teams. Track code quality metrics, deployment frequency, team velocity, and sprint health with beautiful visualizations and AI-powered actionable insights that drive continuous improvement.',
    status: 'Beta Testing',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Sparkle,
    title: 'CloudSync Pro',
    description: 'Next-generation file synchronization and collaboration platform built for distributed teams. Blazing-fast performance with end-to-end encryption, intelligent conflict resolution, and seamless real-time collaboration that feels like magic.',
    status: 'Coming 2025',
    color: 'from-orange-500 to-red-500',
  },
]

export default function Studio() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

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
            Innovation Lab
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Beyond client projects, Jabcore builds its own cutting-edge tools and digital experiences. 
            Our innovation lab is where we explore emerging technologies, experiment with bold ideas, and turn them 
            into real products that push the boundaries of what's possible—many powered by advanced AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((product, index) => {
            const Icon = product.icon
            return (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 group relative overflow-hidden border-2">
                  <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" weight="duotone" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {product.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl">{product.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {product.description}
                    </CardDescription>
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