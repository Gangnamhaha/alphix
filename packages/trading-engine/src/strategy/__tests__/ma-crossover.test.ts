import '../../bun-test'
import type { OHLCV } from '@alphix/shared'
import { MACrossoverStrategy } from '../ma-crossover'

describe('MACrossoverStrategy', () => {
  test('golden cross -> BUY', async () => {
    const strategy = new MACrossoverStrategy(2, 3)
    const signal = await strategy.getSignal(toCandles([3, 2, 1, 4]))
    expect(signal).toBe('BUY')
  })

  test('dead cross -> SELL', async () => {
    const strategy = new MACrossoverStrategy(2, 3)
    const signal = await strategy.getSignal(toCandles([1, 2, 3, 0]))
    expect(signal).toBe('SELL')
  })

  test('insufficient data -> HOLD', async () => {
    const strategy = new MACrossoverStrategy(2, 3)
    const signal = await strategy.getSignal(toCandles([1, 2, 3]))
    expect(signal).toBe('HOLD')
  })
})

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
