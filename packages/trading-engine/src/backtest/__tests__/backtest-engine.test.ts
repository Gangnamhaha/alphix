import '../../bun-test'
import type { OHLCV, Signal, Strategy, StrategyResult } from '@alphix/shared'
import { BacktestEngine } from '../backtest-engine'

describe('BacktestEngine', () => {
  test('simulates strategy with commission/slippage', async () => {
    const engine = new BacktestEngine()
    const strategy = new ThresholdStrategy(102, 99)

    const candles = toCandles([100, 101, 103, 104, 100, 98, 101])
    const result = await engine.run(strategy, candles, {
      initialCapital: 10_000,
      commission: 0.001,
      slippage: 0.001,
    })

    expect(result.totalTrades > 0).toBe(true)
    expect(result.trades.some((trade) => trade.side === 'BUY')).toBe(true)
    expect(result.trades.some((trade) => trade.side === 'SELL')).toBe(true)
  })

  test('returns neutral result when no historical data', async () => {
    const engine = new BacktestEngine()
    const strategy = new ThresholdStrategy(100, 90)

    const result = await engine.run(strategy, [], {
      initialCapital: 10_000,
      commission: 0.001,
      slippage: 0.001,
    })

    expect(result.totalTrades).toBe(0)
    expect(result.totalReturn).toBe(0)
  })

  test('does not place orders when strategy always holds', async () => {
    const engine = new BacktestEngine()
    const strategy = new StaticStrategy('HOLD')

    const result = await engine.run(strategy, toCandles([100, 101, 102]), {
      initialCapital: 10_000,
      commission: 0.001,
      slippage: 0.001,
    })

    expect(result.totalTrades).toBe(0)
  })

  test('opens position when buy signal appears', async () => {
    const engine = new BacktestEngine()
    const strategy = new StaticStrategy('BUY')

    const result = await engine.run(strategy, toCandles([100, 101, 102]), {
      initialCapital: 10_000,
      commission: 0,
      slippage: 0,
    })

    expect(result.trades.length > 0).toBe(true)
    expect(result.trades[0].side).toBe('BUY')
  })
})

class ThresholdStrategy implements Strategy {
  constructor(
    private readonly buyThreshold: number,
    private readonly sellThreshold: number
  ) {}

  async analyze(data: OHLCV[]): Promise<StrategyResult> {
    const signal = await this.getSignal(data)
    return {
      signal,
      confidence: 0.8,
      reason: 'Threshold strategy',
    }
  }

  async getSignal(data: OHLCV[]): Promise<Signal> {
    const lastPrice = data[data.length - 1]?.close
    if (typeof lastPrice !== 'number') return 'HOLD'
    if (lastPrice >= this.buyThreshold) return 'BUY'
    if (lastPrice <= this.sellThreshold) return 'SELL'
    return 'HOLD'
  }

  getRequiredDataPoints(): number {
    return 1
  }
}

class StaticStrategy implements Strategy {
  constructor(private readonly signal: Signal) {}

  async analyze(_data: OHLCV[]): Promise<StrategyResult> {
    return {
      signal: this.signal,
      confidence: 0.8,
      reason: 'static',
    }
  }

  async getSignal(_data: OHLCV[]): Promise<Signal> {
    return this.signal
  }

  getRequiredDataPoints(): number {
    return 1
  }
}

function toCandles(closes: number[]): OHLCV[] {
  return closes.map((close, index) => ({
    date: new Date(Date.UTC(2024, 0, index + 1)),
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 100,
  }))
}
