import type { OHLCV, Signal, Strategy, StrategyResult } from '@alphix/shared'
import { calculateRSI } from './indicators'

export class RSIStrategy implements Strategy {
  constructor(
    private readonly period = 14,
    private readonly overbought = 70,
    private readonly oversold = 30
  ) {}

  async analyze(data: OHLCV[]): Promise<StrategyResult> {
    const signal = await this.getSignal(data)
    return {
      signal,
      confidence: 0.75,
      reason: `RSI(${this.period}) threshold ${this.oversold}/${this.overbought}`,
    }
  }

  async getSignal(data: OHLCV[]): Promise<Signal> {
    if (data.length < this.getRequiredDataPoints()) return 'HOLD'

    const closes = data.map((item) => item.close)
    const rsiValues = calculateRSI(closes, this.period)
    const lastRsi = rsiValues[rsiValues.length - 1]

    if (lastRsi < this.oversold) return 'BUY'
    if (lastRsi > this.overbought) return 'SELL'
    return 'HOLD'
  }

  getRequiredDataPoints(): number {
    return this.period + 1
  }
}
