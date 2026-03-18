import { CircuitBreaker } from './circuit-breaker'

export type RiskPosition = {
  symbol: string
  marketValue: number
}

export type RiskSnapshot = {
  equity: number
  dailyPnlPercent: number
  positions: RiskPosition[]
}

export type RiskOrderIntent = {
  symbol: string
  notional: number
}

export type RiskEvaluation = {
  allowed: boolean
  reason?: string
}

type RiskLimits = {
  dailyLossLimitPercent: number
  maxPositionCount: number
  maxPositionSizePercent: number
  maxConcentrationPercent: number
}

const DEFAULT_LIMITS: RiskLimits = {
  dailyLossLimitPercent: -0.05,
  maxPositionCount: 10,
  maxPositionSizePercent: 0.2,
  maxConcentrationPercent: 0.35,
}

export class RiskManager {
  private readonly limits: RiskLimits

  constructor(
    private readonly circuitBreaker: CircuitBreaker = new CircuitBreaker(),
    limits: Partial<RiskLimits> = {}
  ) {
    this.limits = { ...DEFAULT_LIMITS, ...limits }
  }

  evaluate(snapshot: RiskSnapshot, orderIntent: RiskOrderIntent): RiskEvaluation {
    if (this.circuitBreaker.isActive()) {
      return { allowed: false, reason: 'Circuit breaker active' }
    }

    if (snapshot.dailyPnlPercent <= this.limits.dailyLossLimitPercent) {
      this.circuitBreaker.trigger('Daily loss limit reached')
      return { allowed: false, reason: 'Daily loss limit reached' }
    }

    if (snapshot.equity <= 0) {
      return { allowed: false, reason: 'Invalid account equity' }
    }

    const maxPositionNotional = snapshot.equity * this.limits.maxPositionSizePercent
    if (orderIntent.notional > maxPositionNotional) {
      return { allowed: false, reason: 'Order exceeds max position size' }
    }

    const existing = snapshot.positions.find((position) => position.symbol === orderIntent.symbol)
    if (!existing && snapshot.positions.length >= this.limits.maxPositionCount) {
      return { allowed: false, reason: 'Max position count exceeded' }
    }

    const nextExposure = (existing?.marketValue ?? 0) + orderIntent.notional
    if (nextExposure > snapshot.equity * this.limits.maxConcentrationPercent) {
      return { allowed: false, reason: 'Concentration limit exceeded' }
    }

    return { allowed: true }
  }

  getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker
  }
}
