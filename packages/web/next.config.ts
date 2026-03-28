import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@alphix/shared', '@alphix/trading-engine'],
  headers: async () => [
    {
      source: '/(login|signup|forgot-password)',
      headers: [
        { key: 'Cache-Control', value: 'no-store' },
        { key: 'Pragma', value: 'no-cache' },
      ],
    },
  ],
}

export default nextConfig
