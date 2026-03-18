import type { OHLCV, Signal, Strategy, StrategyResult } from '@alphix/shared'
import { calculateMACD } from './indicators'

export class MACDStrategy implements Strategy {
  constructor(
    private readonly fastPeriod = 12,
    private readonly slowPeriod = 26,
    private readonly signalPeriod = 9
  ) {}

  async analyze(data: OHLCV[]): Promise<StrategyResult> {
    const signal = await this.getSignal(data)
    return {
      signal,
      confidence: 0.73,
      reason: `MACD(${this.fastPeriod}, ${this.slowPeriod}, ${this.signalPeriod}) alignment`,
    }
  }

  async getSignal(data: OHLCV[]): Promise<Signal> {
    if (data.length < this.getRequiredDataPoints()) return 'HOLD'

    const closes = data.map((item) => item.close)
    const macdResult = calculateMACD(closes, this.fastPeriod, this.slowPeriod, this.signalPeriod)

    if (macdResult.macd.length === 0 || macdResult.signal.length === 0) return 'HOLD'

    const macd = macdResult.macd[macdResult.macd.length - 1]
    const signal = macdResult.signal[macdResult.signal.length - 1]

    if (macd > signal) return 'BUY'
    if (macd < signal) return 'SELL'
    if (macd > 0) return 'BUY'
    if (macd < 0) return 'SELL'
    return 'HOLD'
  }

  getRequiredDataPoints(): number {
    return this.slowPeriod + this.signalPeriod - 1
  }
}
