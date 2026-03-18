import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@alphix/shared', '@alphix/trading-engine'],
}

export default nextConfig
