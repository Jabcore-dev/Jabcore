import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /*
   * Standalone output for Docker. Next bundles the server together with only
   * the dependencies the runtime actually needs, so the image carries no
   * node_modules. See Dockerfile.
   */
  output: 'standalone',

  poweredByHeader: false,

  /*
   * Metadata (title, description, canonical, hreflang) always in <head>.
   * Next 15 streams them into <body> for clients it doesn't list as bots, which
   * was everyone we checked, Googlebot and the AI crawlers included: Lighthouse
   * reported a missing meta description and a crawler that doesn't run
   * JavaScript found no <title> in <head>. Matching every user agent makes the
   * metadata blocking again; the cost is a few ms before the first byte.
   */
  htmlLimitedBots: /.*/,

  // Trailing slash consistency
  trailingSlash: false,

  images: {
    // Served by the Node runtime now, so optimization is back on.
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
