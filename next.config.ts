import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: [],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'jabcore.eu' }],
        destination: 'https://jabcore.cz/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.jabcore.eu' }],
        destination: 'https://jabcore.cz/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
