# Jabcore — Jádro vaší nové aplikace.

> Premium software development company website — [jabcore.cz](https://jabcore.cz)

A modern, fully responsive, SEO-optimized multi-language website for **Jabcore**, a Prague-based software studio specializing in mobile & web apps, enterprise systems, and AI-powered solutions.

## Features

- **12 Languages** — Czech, English, German, Spanish, Polish, Slovak, French, Italian, Dutch, Portuguese, Hungarian, Romanian
- **i18n URL Routing** — `/{locale}/` prefix pattern with server-rendered meta tags per language (`/cs/services`, `/en/about`, …)
- **Full SEO** — hreflang alternates, canonical URLs, Open Graph, Twitter Cards, JSON-LD structured data, dynamic sitemap, robots.txt
- **Static Export** — 83 pre-rendered HTML pages deployed to GitHub Pages
- **Light/Dark Theme** — system preference detection, localStorage persistence, theme-aware logos
- **Contact Form** — validated with React Hook Form + Zod, sent via EmailJS
- **Animations** — scroll-triggered, physics-based motion via Framer Motion
- **Responsive** — mobile-first, optimized for all screen sizes

## Pages

| Route | Description |
|-------|-------------|
| `/{locale}/` | Homepage — hero, services preview, why choose us, collaboration process, tech stack, CTA |
| `/{locale}/services` | Full services breakdown — mobile apps, enterprise systems, web apps, websites |
| `/{locale}/products` | Jabcore's own products and applications |
| `/{locale}/stack` | Technology stack and tools used |
| `/{locale}/about` | Company mission, values, and philosophy |
| `/{locale}/contact` | Contact form with validation |

Old routes (`/services`, `/about`, etc.) automatically redirect to the locale-prefixed version.

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Framework | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS v4, CSS custom properties |
| i18n | i18next, react-i18next, per-locale JSON files |
| UI | shadcn/ui, Radix UI primitives |
| Forms | React Hook Form, Zod, EmailJS |
| Animation | Framer Motion |
| Icons | Phosphor Icons |
| Deployment | Static export → GitHub Pages |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (html/body, GA scripts)
│   ├── [locale]/
│   │   ├── layout.tsx          # Locale layout (metadata, providers, nav, footer)
│   │   ├── page.tsx            # Homepage
│   │   ├── services/page.tsx
│   │   ├── products/page.tsx
│   │   ├── stack/page.tsx
│   │   ├── about/page.tsx
│   │   └── contact/page.tsx
│   ├── sitemap.ts              # 72 URLs (12 locales × 6 pages)
│   └── robots.ts
├── components/
│   ├── sections/               # Page sections (Hero, Footer, Navigation, …)
│   ├── providers/              # I18nProvider, Providers (theme, i18n)
│   └── ui/                     # shadcn/ui components
├── hooks/                      # useLocale, useSEO, useMobile
├── lib/                        # i18n config, metadata generator, utils
├── locales/                    # 12 translation JSON files
└── views/                      # Page view compositions
```

## Getting Started

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build      # Static export to out/
```

The site is deployed to **GitHub Pages** at [jabcore.cz](https://jabcore.cz) via the `CNAME` file.

## SEO

- Per-locale `<title>`, `<meta description>`, `<meta keywords>`
- `hreflang` alternates for all 12 languages + `x-default`
- Canonical URLs with locale prefix
- Open Graph tags (`og:title`, `og:description`, `og:locale`, `og:image`)
- Twitter Card meta tags
- JSON-LD Organization/LocalBusiness structured data
- Dynamic sitemap with priority and change frequency per page
- Client-side `DynamicSeoTitle` component for SPA navigation updates

## Design

- **Typography** — Space Grotesk (headlines), Inter (body)
- **Colors** — Primary: deep electric blue `oklch(0.45 0.15 255)`, Accent: bright cyan `oklch(0.75 0.15 195)`
- **Contrast** — WCAG AA compliant

## License

See [LICENSE](LICENSE).

Logo switching logic:
```typescript
// Navigation
<img src={theme === 'light' ? logoDark : logoLight} />

// Footer
<img src={theme === 'light' ? logoBlack : logoWhite} />
```

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Responsive Breakpoints

- **Mobile**: < 768px (stacked layouts, hamburger menu)
- **Tablet**: 768px - 1024px (2-column grids)
- **Desktop**: > 1024px (4-column services, full navigation)
- **Ultrawide**: > 1536px (maintains max-width for readability)

## ⚡ Performance

- **Smooth 60fps animations** using Framer Motion
- **Intersection Observer** for scroll-triggered animations
- **Optimized re-renders** with proper React patterns
- **Client-side routing** for instant page transitions
- **Automatic scroll restoration** on route changes

## 📄 License

Built for Jabcore. All rights reserved.

---

**Made with precision by Jabcore** 🔵
