/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/dynamic-css-manifest\.json/],
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
    domains: ['localhost', 'flydacnsbsnpwpqezuof.supabase.co'],
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
    ]
  },
}

module.exports = withPWA(nextConfig)
