import type { OHLCV, Signal, Strategy, StrategyResult } from '@alphix/shared'

export class GridTradingStrategy implements Strategy {
  constructor(
    private readonly lowerBound = 90,
    private readonly upperBound = 110,
    private readonly gridCount = 10
  ) {}

  async analyze(data: OHLCV[]): Promise<StrategyResult> {
    const signal = await this.getSignal(data)
    return {
      signal,
      confidence: 0.68,
      reason: `Grid(${this.lowerBound}-${this.upperBound}, ${this.gridCount} levels)`,
    }
  }

  async getSignal(data: OHLCV[]): Promise<Signal> {
    if (data.length < this.getRequiredDataPoints()) return 'HOLD'
    if (this.upperBound <= this.lowerBound || this.gridCount <= 0) return 'HOLD'

    const currentPrice = data[data.length - 1].close
    const step = (this.upperBound - this.lowerBound) / this.gridCount

    if (step === 0) return 'HOLD'

    const normalized = (currentPrice - this.lowerBound) / step
    const nearestIndex = Math.min(this.gridCount, Math.max(0, Math.round(normalized)))
    const nearestLevel = this.lowerBound + nearestIndex * step

    if (currentPrice < nearestLevel) return 'BUY'
    if (currentPrice > nearestLevel) return 'SELL'
    return 'HOLD'
  }

  getRequiredDataPoints(): number {
    return 1
  }
}
