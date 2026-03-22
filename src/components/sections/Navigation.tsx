'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, List, X, GithubLogo, LinkedinLogo, FacebookLogo, InstagramLogo, Envelope } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState, useCallback, useMemo, memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import ContactModal from '@/components/ContactModal'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import logoTransparent from '@/assets/images/transparent.png'
import { useTranslation } from 'react-i18next'

const Navigation = memo(function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const navItems = useMemo(() => [
    { label: t('navigation.home'), href: '/' },
    { label: t('navigation.services'), href: '/services' },
    // { label: t('navigation.products'), href: '/products' },
    { label: t('navigation.stack'), href: '/stack' },
    { label: t('navigation.about'), href: '/about' },
    { label: t('navigation.contact'), href: '/contact' },
  ], [t])

  const socialLinks = useMemo(() => [
    { icon: GithubLogo, label: 'GitHub', href: 'https://github.com/Jabcore-dev' },
    { icon: LinkedinLogo, label: 'LinkedIn', href: 'https://www.linkedin.com/company/jabcore' },
    { icon: FacebookLogo, label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61584245041851' },
    { icon: InstagramLogo, label: 'Instagram', href: 'https://www.instagram.com/jabcore.dev/' },
  ], [])

  const isActive = useCallback((href: string) => pathname === href, [pathname])

  const handleContactClick = useCallback(() => {
    setIsOpen(false)
    setIsContactOpen(true)
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/" className="flex items-center gap-3">
            <img src={logoTransparent.src} alt="Jabcore" className="w-10 h-10 rounded-lg object-contain" />
            <span className="text-xl font-display font-bold gradient-text">Jabcore</span>
          </Link>
        </motion.div>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link
                href={item.href}
                className={`font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-primary'
                    : 'text-foreground/80 hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <LanguageSwitcher />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
            {socialLinks.map((social, index) => {
              const Icon = social.icon
              return (
                <motion.div
                  key={social.label}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                >
                  <a
                    href={social.href}
                    aria-label={social.label}
                    className="text-foreground/60 hover:text-primary transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <AnimatePresence mode="wait">
                  {!isOpen ? (
                    <motion.div
                      key="menu"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <List className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="close"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6">
              <div className="flex flex-col h-full">
                <div className="flex-1 flex flex-col gap-1 mt-12">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`block px-3 py-2.5 rounded-md text-base font-normal transition-colors ${
                          isActive(item.href)
                            ? 'text-primary font-medium'
                            : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="space-y-4 pt-6 border-t border-border"
                >
                  <Button
                    onClick={handleContactClick}
                    className="w-full h-11 text-base"
                    size="lg"
                  >
                    <Envelope className="mr-2" />
                    {t('contact.getInTouch')}
                  </Button>

                  <div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {t('navigation.followUs')}
                    </p>
                    <div className="flex gap-3">
                      {socialLinks.map((social, index) => {
                        const Icon = social.icon
                        return (
                          <motion.a
                            key={social.label}
                            href={social.href}
                            aria-label={social.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.05, duration: 0.2 }}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Icon className="w-5 h-5" />
                          </motion.a>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      <ContactModal open={isContactOpen} onOpenChange={setIsContactOpen} />
    </motion.header>
  )
})

export default Navigation
