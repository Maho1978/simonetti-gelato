/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/dynamic-css-manifest\.json/],
  runtimeCaching: [
    {
      urlPattern: /\/checkout/,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /\/\.well-known\//,
      handler: 'NetworkOnly',
    },
    ...require('next-pwa/cache'),
  ],
})

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'flydacnsbsnpwpqezuof.supabase.co' },
    ],
  },
  turbopack: {},
  serverExternalPackages: ['sharp'],
  outputFileTracingIncludes: {
    '/api/admin/**': ['./public/fonts/**/*'],
  },
  async headers() {
    return [
      {
        source: '/datenschutz',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/.well-known/apple-developer-merchantid-domain-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/octet-stream',
          },
        ],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
