import '../../bun-test'
import { createStrategy, MACrossoverStrategy, RSIStrategy } from '../index'

describe('createStrategy', () => {
  test('creates MA crossover strategy for ma-crossover type', () => {
    const strategy = createStrategy('ma-crossover')
    expect(strategy).toBeInstanceOf(MACrossoverStrategy)
  })

  test('creates RSI strategy with custom params', () => {
    const strategy = createStrategy('rsi', { period: 7, overbought: 75, oversold: 25 })
    expect(strategy).toBeInstanceOf(RSIStrategy)
    expect(strategy.getRequiredDataPoints()).toBe(8)
  })
})
