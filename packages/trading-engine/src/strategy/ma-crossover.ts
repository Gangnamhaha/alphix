import type { OHLCV, Signal, Strategy, StrategyResult } from '@alphix/shared'
import { calculateSMA } from './indicators'

export class MACrossoverStrategy implements Strategy {
  constructor(
    private readonly shortPeriod = 5,
    private readonly longPeriod = 20
  ) {}

  async analyze(data: OHLCV[]): Promise<StrategyResult> {
    const signal = await this.getSignal(data)
    return {
      signal,
      confidence: 0.7,
      reason: `${this.shortPeriod}/${this.longPeriod} MA crossover`,
    }
  }

  async getSignal(data: OHLCV[]): Promise<Signal> {
    if (data.length < this.getRequiredDataPoints()) return 'HOLD'

    const closes = data.map((item) => item.close)
    const shortMA = calculateSMA(closes, this.shortPeriod)
    const longMA = calculateSMA(closes, this.longPeriod)

    if (shortMA.length < 2 || longMA.length < 2) return 'HOLD'

    const lastShort = shortMA[shortMA.length - 1]
    const lastLong = longMA[longMA.length - 1]
    const prevShort = shortMA[shortMA.length - 2]
    const prevLong = longMA[longMA.length - 2]

    if (prevShort <= prevLong && lastShort > lastLong) return 'BUY'
    if (prevShort >= prevLong && lastShort < lastLong) return 'SELL'

    return 'HOLD'
  }

  getRequiredDataPoints(): number {
    return this.longPeriod + 1
  }
}
