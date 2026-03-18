export type SubscriptionTier = 'free' | 'basic' | 'pro'

export interface User {
  id: number
  email: string
  name: string
  subscriptionTier: SubscriptionTier
}

export interface Subscription {
  id: number
  userId: number
  plan: SubscriptionTier
  status: 'active' | 'cancelled' | 'past_due'
  currentPeriodEnd: Date
}

export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return value === 'free' || value === 'basic' || value === 'pro'
}

export function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<User>

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.email === 'string' &&
    typeof candidate.name === 'string' &&
    isSubscriptionTier(candidate.subscriptionTier)
  )
}

export function isSubscription(value: unknown): value is Subscription {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<Subscription>

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.userId === 'number' &&
    isSubscriptionTier(candidate.plan) &&
    (candidate.status === 'active' || candidate.status === 'cancelled' || candidate.status === 'past_due') &&
    candidate.currentPeriodEnd instanceof Date
  )
}
