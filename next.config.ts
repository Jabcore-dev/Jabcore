import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /*
   * Standalone output for Docker. Next bundles the server together with only
   * the dependencies the runtime actually needs, so the image carries no
   * node_modules. See Dockerfile.
   */
  output: 'standalone',

  poweredByHeader: false,

  // Trailing slash consistency
  trailingSlash: false,

  images: {
    // Served by the Node runtime now, so optimization is back on.
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
