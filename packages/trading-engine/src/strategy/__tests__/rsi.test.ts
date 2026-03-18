import '../../bun-test'
import type { OHLCV } from '@alphix/shared'
import { RSIStrategy } from '../rsi'

describe('RSIStrategy', () => {
  test('RSI < 30 -> BUY', async () => {
    const strategy = new RSIStrategy(2, 70, 30)
    const signal = await strategy.getSignal(toCandles([5, 4, 3]))
    expect(signal).toBe('BUY')
  })

  test('RSI > 70 -> SELL', async () => {
    const strategy = new RSIStrategy(2, 70, 30)
    const signal = await strategy.getSignal(toCandles([1, 2, 3]))
    expect(signal).toBe('SELL')
  })

  test('RSI = 50 -> HOLD', async () => {
    const strategy = new RSIStrategy(2, 70, 30)
    const signal = await strategy.getSignal(toCandles([1, 2, 1]))
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
