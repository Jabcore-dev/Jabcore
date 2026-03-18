'use client'

import { GithubLogo, LinkedinLogo, FacebookLogo, InstagramLogo, EnvelopeSimple, Phone } from '@phosphor-icons/react'
import logoWhite from '@/assets/images/white.png'
import logoBlack from '@/assets/images/black.png'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { resolvedTheme } = useTheme()
  const { t } = useTranslation()

  const socialLinks = [
    { icon: GithubLogo, label: 'GitHub', href: 'https://github.com/Jabcore-dev' },
    { icon: LinkedinLogo, label: 'LinkedIn', href: 'https://www.linkedin.com/company/jabcore' },
    { icon: FacebookLogo, label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61584245041851' },
    { icon: InstagramLogo, label: 'Instagram', href: 'https://www.instagram.com/jabcore.dev/' },
  ]

  const contactInfo = [
    { icon: EnvelopeSimple, label: t('contact.generalInquiries'), value: 'info@jabcore.cz', href: 'mailto:info@jabcore.cz' },
    { icon: EnvelopeSimple, label: t('contact.devTeam'), value: 'dev@jabcore.cz', href: 'mailto:dev@jabcore.cz' },
    { icon: Phone, label: t('contact.phone'), value: '+420 792 219 454', href: 'tel:+420792219454' },
  ]

  return (
    <footer className="bg-secondary/30 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <img
                src={resolvedTheme === 'light' ? logoBlack.src : logoWhite.src}
                alt="Jabcore"
                className="w-10 h-10 object-contain"
              />
              <span className="font-display text-2xl font-bold text-foreground">Jabcore</span>
            </Link>
            <p className="text-muted-foreground mb-4">{t('footer.description')}</p>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a key={social.label} href={social.href} aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5 text-primary" weight="fill" />
                  </a>
                )
              })}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: t('navigation.home') },
                { href: '/services', label: t('navigation.services') },
                { href: '/products', label: t('navigation.products') },
                { href: '/stack', label: t('navigation.stack') },
                { href: '/about', label: t('navigation.about') },
                { href: '/contact', label: t('navigation.contact') },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">{t('footer.contactUs')}</h4>
            <ul className="space-y-3">
              {contactInfo.map((info, index) => {
                const Icon = info.icon
                return (
                  <li key={index}>
                    <a href={info.href} className="flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                      <Icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" weight="bold" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground/80 uppercase tracking-wide">{info.label}</span>
                        <span className="font-medium">{info.value}</span>
                      </div>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-muted-foreground">
          <p>© {currentYear} Jabcore. {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
