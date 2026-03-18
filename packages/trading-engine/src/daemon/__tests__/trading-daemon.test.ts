import '../../bun-test'
import type { OHLCV, Signal, Strategy, StrategyResult } from '@alphix/shared'
import { ScheduleManager } from '../schedule-manager'
import { TradingDaemon } from '../trading-daemon'

describe('ScheduleManager', () => {
  test('supports KR/US/Crypto sessions', () => {
    const manager = new ScheduleManager()

    const krOpen = manager.isMarketOpen('KR', new Date('2024-01-02T01:00:00.000Z'))
    expect(krOpen).toBe(true)

    const usOpen = manager.isMarketOpen('US', new Date('2024-01-02T15:00:00.000Z'))
    expect(usOpen).toBe(true)

    const cryptoOpen = manager.isMarketOpen('CRYPTO', new Date('2024-01-07T00:00:00.000Z'))
    expect(cryptoOpen).toBe(true)
  })
})

describe('TradingDaemon', () => {
  test('runs cycle with data->signal->order flow', async () => {
    const executions: string[] = []
    const daemon = new TradingDaemon({
      dataProvider: async () => toCandles([100, 101, 102]),
      orderExecutor: async ({ strategyId }) => {
        executions.push(strategyId)
      },
    })

    daemon.registerStrategy({
      id: 'strat-1',
      symbol: 'BTCUSDT',
      market: 'CRYPTO',
      strategy: new StaticSignalStrategy('BUY'),
    })

    daemon.start()
    const result = await daemon.runCycle(new Date('2024-01-01T00:00:00.000Z'))

    expect(result.executedStrategies).toBe(1)
    expect(result.errors.length).toBe(0)
    expect(executions[0]).toBe('strat-1')
  })

  test('isolates strategy errors and keeps others running', async () => {
    const executions: string[] = []
    const daemon = new TradingDaemon({
      dataProvider: async () => toCandles([100, 101, 102]),
      orderExecutor: async ({ strategyId }) => {
        executions.push(strategyId)
      },
    })

    daemon.registerStrategy({
      id: 'bad',
      symbol: 'BTCUSDT',
      market: 'CRYPTO',
      strategy: new ThrowingStrategy(),
    })

    daemon.registerStrategy({
      id: 'good',
      symbol: 'ETHUSDT',
      market: 'CRYPTO',
      strategy: new StaticSignalStrategy('BUY'),
    })

    daemon.start()
    const result = await daemon.runCycle(new Date('2024-01-01T00:00:00.000Z'))

    expect(result.errors.length).toBe(1)
    expect(result.errors[0].strategyId).toBe('bad')
    expect(executions.includes('good')).toBe(true)
  })

  test('skips execution when daemon stopped or market closed', async () => {
    const executions: string[] = []
    const daemon = new TradingDaemon({
      dataProvider: async () => toCandles([100, 101, 102]),
      orderExecutor: async ({ strategyId }) => {
        executions.push(strategyId)
      },
    })

    daemon.registerStrategy({
      id: 'us-only',
      symbol: 'AAPL',
      market: 'US',
      strategy: new StaticSignalStrategy('BUY'),
    })

    const stopped = await daemon.runCycle(new Date('2024-01-02T15:00:00.000Z'))
    expect(stopped.executedStrategies).toBe(0)

    daemon.start()
    const closedMarket = await daemon.runCycle(new Date('2024-01-06T15:00:00.000Z'))
    expect(closedMarket.executedStrategies).toBe(0)
    expect(executions.length).toBe(0)
  })

  test('does not place order on HOLD signal', async () => {
    const executions: string[] = []
    const daemon = new TradingDaemon({
      dataProvider: async () => toCandles([100, 101, 102]),
      orderExecutor: async ({ strategyId }) => {
        executions.push(strategyId)
      },
    })

    daemon.registerStrategy({
      id: 'hold-only',
      symbol: 'BTCUSDT',
      market: 'CRYPTO',
      strategy: new StaticSignalStrategy('HOLD'),
    })

    daemon.start()
    const result = await daemon.runCycle(new Date('2024-01-01T00:00:00.000Z'))

    expect(result.executedStrategies).toBe(1)
    expect(executions.length).toBe(0)
  })
})

class StaticSignalStrategy implements Strategy {
  constructor(private readonly signal: Signal) {}

  async analyze(_data: OHLCV[]): Promise<StrategyResult> {
    return {
      signal: this.signal,
      confidence: 0.7,
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

class ThrowingStrategy implements Strategy {
  async analyze(_data: OHLCV[]): Promise<StrategyResult> {
    throw new Error('strategy failed')
  }

  async getSignal(_data: OHLCV[]): Promise<Signal> {
    throw new Error('strategy failed')
  }

  getRequiredDataPoints(): number {
    return 1
  }
}

function toCandles(closes: number[]): OHLCV[] {
  return closes.map((close, index) => ({
    date: new Date(Date.UTC(2024, 0, index + 1)),
    open: close,
    high: close,
    low: close,
    close,
    volume: 100,
  }))
}
