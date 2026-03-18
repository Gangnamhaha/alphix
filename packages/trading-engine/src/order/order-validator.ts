import type { OrderRequest } from '@alphix/shared'

export type OrderValidationContext = {
  availableBalance: number
  marketPriceBySymbol: Record<string, number>
  isMarketOpen: boolean
  isCircuitBreakerActive: boolean
}

type OrderValidationLimits = {
  minQuantity: number
  maxQuantity: number
}

export type OrderValidationResult = {
  valid: boolean
  reason?: string
}

const DEFAULT_LIMITS: OrderValidationLimits = {
  minQuantity: 0.0001,
  maxQuantity: 1_000_000,
}

export class OrderValidator {
  constructor(private readonly limits: OrderValidationLimits = DEFAULT_LIMITS) {}

  validate(order: OrderRequest, context: OrderValidationContext): OrderValidationResult {
    if (order.quantity < this.limits.minQuantity) {
      return { valid: false, reason: 'Quantity below minimum' }
    }

    if (order.quantity > this.limits.maxQuantity) {
      return { valid: false, reason: 'Quantity above maximum' }
    }

    if (!context.isMarketOpen) {
      return { valid: false, reason: 'Market is closed' }
    }

    if (context.isCircuitBreakerActive) {
      return { valid: false, reason: 'Circuit breaker active' }
    }

    if (order.side === 'BUY') {
      const marketPrice = context.marketPriceBySymbol[order.symbol]
      const unitPrice = order.type === 'LIMIT' ? order.price : marketPrice

      if (typeof unitPrice !== 'number' || unitPrice <= 0) {
        return { valid: false, reason: 'Unable to determine order price' }
      }

      if (unitPrice * order.quantity > context.availableBalance) {
        return { valid: false, reason: 'Insufficient balance' }
      }
    }

    return { valid: true }
  }
}
