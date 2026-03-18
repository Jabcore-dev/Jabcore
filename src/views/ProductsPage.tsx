'use client'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppleLogo, GooglePlayLogo, Pill, Globe } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useSEO } from '@/hooks/useSEO'

export default function ProductsPage() {
  const { t } = useTranslation()
  
  useSEO({ page: 'products', url: 'https://jabcore.cz/products' })
  
  const products = [
    {
      id: 1,
      name: t('products.pillsee.name'),
      tagline: t('products.pillsee.tagline'),
      description: t('products.pillsee.description'),
      icon: Pill,
      features: t('products.pillsee.features', { returnObjects: true }) as string[],
      appStoreUrl: '#',
      playStoreUrl: '#',
      websiteUrl: 'https://pillsee.app',
      color: 'from-blue-500 to-cyan-400',
      available: true
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-1.5 text-sm font-medium">{t('products.badge')}</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
            {t('products.title').split(' ').slice(0, -2).join(' ')} <span className="gradient-text">{t('products.title').split(' ').slice(-2).join(' ')}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('products.subtitle')}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto"
        >
          {products.map((product) => {
            const Icon = product.icon
            return (
              <motion.div key={product.id} variants={itemVariants}>
                <Card className="overflow-hidden h-full hover:shadow-2xl transition-all duration-300 border-2 group">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-start gap-6">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${product.color} p-4 shadow-lg group-hover:shadow-xl transition-shadow`}
                      >
                        <Icon className="w-full h-full text-white" weight="duotone" />
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h2 className="text-2xl font-display font-bold">{product.name}</h2>
                          {product.available && (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 flex-shrink-0">
                              {t('products.pillsee.available')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-primary font-medium">{product.tagline}</p>
                      </div>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full" />
                        {t('products.pillsee.keyFeatures')}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {product.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                            <span className="text-primary mt-0.5 font-bold">✓</span>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button 
                        asChild 
                        className="flex-1 gap-2 group/btn"
                        size="lg"
                      >
                        <a href={product.websiteUrl} target="_blank" rel="noopener noreferrer">
                          <Globe weight="fill" className="group-hover/btn:scale-110 transition-transform" />
                          {t('products.pillsee.website')}
                        </a>
                      </Button>
                      <Button 
                        asChild 
                        variant="outline" 
                        className="flex-1 gap-2 group/btn"
                        size="lg"
                      >
                        <a href={product.appStoreUrl} target="_blank" rel="noopener noreferrer">
                          <AppleLogo weight="fill" className="group-hover/btn:scale-110 transition-transform" />
                          {t('products.pillsee.appStore')}
                        </a>
                      </Button>
                      <Button 
                        asChild 
                        variant="outline" 
                        className="flex-1 gap-2 group/btn"
                        size="lg"
                      >
                        <a href={product.playStoreUrl} target="_blank" rel="noopener noreferrer">
                          <GooglePlayLogo weight="fill" className="group-hover/btn:scale-110 transition-transform" />
                          {t('products.pillsee.googlePlay')}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <div className="inline-block p-6 rounded-2xl bg-muted/50 border border-border">
            <p className="text-muted-foreground mb-2">{t('products.comingSoon')}</p>
            <p className="text-sm text-muted-foreground/70">
              {t('products.stayTuned')}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
