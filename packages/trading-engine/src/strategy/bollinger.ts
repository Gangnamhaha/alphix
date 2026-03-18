import type { OHLCV, Signal, Strategy, StrategyResult } from '@alphix/shared'
import { calculateBollingerBands } from './indicators'

export class BollingerBandsStrategy implements Strategy {
  constructor(
    private readonly period = 20,
    private readonly stdDev = 2
  ) {}

  async analyze(data: OHLCV[]): Promise<StrategyResult> {
    const signal = await this.getSignal(data)
    return {
      signal,
      confidence: 0.72,
      reason: `Bollinger(${this.period}, ${this.stdDev}σ) band touch`,
    }
  }

  async getSignal(data: OHLCV[]): Promise<Signal> {
    if (data.length < this.getRequiredDataPoints()) return 'HOLD'

    const closes = data.map((item) => item.close)
    const bands = calculateBollingerBands(closes, this.period, this.stdDev)

    if (bands.lower.length === 0 || bands.upper.length === 0) return 'HOLD'

    const lastClose = closes[closes.length - 1]
    const lowerBand = bands.lower[bands.lower.length - 1]
    const upperBand = bands.upper[bands.upper.length - 1]

    if (lastClose <= lowerBand) return 'BUY'
    if (lastClose >= upperBand) return 'SELL'
    return 'HOLD'
  }

  getRequiredDataPoints(): number {
    return this.period
  }
}
