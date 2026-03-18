import '../../bun-test'
import type { Trade } from '@alphix/shared'
import {
  calculateCagr,
  calculateMaxDrawdown,
  calculatePerformance,
  calculateProfitFactor,
  calculateSharpeRatio,
  calculateWinRate,
} from '../performance'

describe('performance metrics', () => {
  test('calculates cagr and max drawdown', () => {
    const cagr = calculateCagr(1000, 1210, new Date('2023-01-01T00:00:00.000Z'), new Date('2024-01-01T00:00:00.000Z'))
    expect(cagr).toBeCloseTo(0.21, 2)

    const mdd = calculateMaxDrawdown([100, 120, 90, 130, 80])
    expect(mdd).toBeCloseTo(0.3846, 3)
  })

  test('calculates sharpe, win rate, and profit factor', () => {
    const sharpe = calculateSharpeRatio([100, 102, 101, 104, 108])
    expect(sharpe > 0).toBe(true)

    const trades: Trade[] = [
      { date: new Date('2024-01-01T00:00:00.000Z'), side: 'BUY', price: 100, quantity: 1, pnl: 0 },
      { date: new Date('2024-01-02T00:00:00.000Z'), side: 'SELL', price: 110, quantity: 1, pnl: 10 },
      { date: new Date('2024-01-03T00:00:00.000Z'), side: 'BUY', price: 100, quantity: 1, pnl: 0 },
      { date: new Date('2024-01-04T00:00:00.000Z'), side: 'SELL', price: 95, quantity: 1, pnl: -5 },
    ]

    expect(calculateWinRate(trades)).toBe(0.5)
    expect(calculateProfitFactor(trades)).toBe(2)
  })

  test('aggregates full performance set', () => {
    const result = calculatePerformance({
      trades: [
        { date: new Date('2024-01-02T00:00:00.000Z'), side: 'SELL', price: 110, quantity: 1, pnl: 10 },
        { date: new Date('2024-01-04T00:00:00.000Z'), side: 'SELL', price: 95, quantity: 1, pnl: -5 },
      ],
      initialCapital: 1000,
      finalEquity: 1050,
      equityCurve: [1000, 1010, 990, 1050],
      startDate: new Date('2024-01-01T00:00:00.000Z'),
      endDate: new Date('2025-01-01T00:00:00.000Z'),
    })

    expect(result.totalReturn).toBeCloseTo(0.05, 4)
    expect(result.winRate).toBe(0.5)
    expect(result.profitFactor).toBe(2)
  })
})
