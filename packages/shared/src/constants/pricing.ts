import type { SubscriptionTier } from '../types/user'

export interface PricingLimit {
  maxStrategies: number
  maxBrokerConnections: number
  maxBacktestsPerDay: number
  realtimeData: boolean
  aiSignals: boolean
}

export const PRICING_LIMITS: Record<SubscriptionTier, PricingLimit> = {
  free: {
    maxStrategies: 1,
    maxBrokerConnections: 1,
    maxBacktestsPerDay: 3,
    realtimeData: false,
    aiSignals: false,
  },
  basic: {
    maxStrategies: 5,
    maxBrokerConnections: 2,
    maxBacktestsPerDay: 20,
    realtimeData: true,
    aiSignals: false,
  },
  pro: {
    maxStrategies: 20,
    maxBrokerConnections: 10,
    maxBacktestsPerDay: 100,
    realtimeData: true,
    aiSignals: true,
  },
}

export function isSubscriptionTierLimit(value: unknown): value is SubscriptionTier {
  return typeof value === 'string' && value in PRICING_LIMITS
}
