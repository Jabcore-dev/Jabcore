import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export for GitHub Pages deployment
  // All pages are static — no server actions, no API routes
  output: 'export',

  // Trailing slash consistency
  trailingSlash: false,

  images: {
    // Static export doesn't support Next.js Image Optimization — use unoptimized
    unoptimized: true,
  },
}

export default nextConfig
