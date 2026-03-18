import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@alphix/shared', '@alphix/trading-engine'],
}

export default nextConfig
