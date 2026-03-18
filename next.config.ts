import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages deployment
  // All pages are static — no server actions, no API routes
  output: 'export',

  // Trailing slash consistency — Cloudflare Pages handles both /about and /about/
  trailingSlash: false,

  images: {
    // Static export doesn't support Next.js Image Optimization — use unoptimized
    unoptimized: true,
  },

  // NOTE: async redirects() is NOT supported with output: 'export'
  // jabcore.eu -> jabcore.cz redirects are handled at Cloudflare level
  // See: public/_redirects (Cloudflare Pages redirect rules)
}

export default nextConfig
