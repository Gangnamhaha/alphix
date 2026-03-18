import '../../bun-test'
import { PaperTradingEngine } from '../paper-engine'

describe('PaperTradingEngine', () => {
  test('fills market orders and updates virtual balance/positions', () => {
    const engine = new PaperTradingEngine({
      initialBalance: 10_000,
      feeRate: 0.001,
      slippageRate: 0.001,
      startedAt: new Date('2024-01-01T00:00:00.000Z'),
    })

    const buy = engine.placeOrder({
      order: { symbol: 'AAPL', side: 'BUY', quantity: 10, type: 'MARKET' },
      marketPrice: 100,
    })

    expect(buy.response.status).toBe('FILLED')
    expect(engine.getBalance() < 10_000).toBe(true)

    const positions = engine.getPositions({ AAPL: 105 })
    expect(positions.length).toBe(1)
    expect(positions[0].symbol).toBe('AAPL')
    expect(positions[0].pnl > 0).toBe(true)
  })

  test('fills limit orders only when price condition is satisfied', () => {
    const engine = new PaperTradingEngine({
      initialBalance: 10_000,
      feeRate: 0.001,
      slippageRate: 0.0005,
      startedAt: new Date('2024-01-01T00:00:00.000Z'),
    })

    const pending = engine.placeOrder({
      order: { symbol: 'AAPL', side: 'BUY', quantity: 5, type: 'LIMIT', price: 90 },
      marketPrice: 100,
    })
    expect(pending.response.status).toBe('PENDING')

    const filled = engine.placeOrder({
      order: { symbol: 'AAPL', side: 'BUY', quantity: 5, type: 'LIMIT', price: 101 },
      marketPrice: 100,
    })
    expect(filled.response.status).toBe('FILLED')
  })

  test('simulates fee/slippage and 30-day mandatory period', () => {
    const startedAt = new Date('2024-01-01T00:00:00.000Z')
    const engine = new PaperTradingEngine({
      initialBalance: 10_000,
      feeRate: 0.002,
      slippageRate: 0.01,
      startedAt,
    })

    const result = engine.placeOrder({
      order: { symbol: 'MSFT', side: 'BUY', quantity: 1, type: 'MARKET' },
      marketPrice: 100,
    })

    expect(result.fee).toBeCloseTo(0.202, 3)
    expect(result.slippage).toBeCloseTo(1, 3)

    const midStatus = engine.getPaperTradingStatus(new Date('2024-01-15T00:00:00.000Z'))
    expect(midStatus.eligible).toBe(false)
    expect(midStatus.daysRemaining).toBe(16)

    const finalStatus = engine.getPaperTradingStatus(new Date('2024-02-01T00:00:00.000Z'))
    expect(finalStatus.eligible).toBe(true)
    expect(finalStatus.daysRemaining).toBe(0)
  })

  test('rejects sell order when no holdings exist', () => {
    const engine = new PaperTradingEngine({
      initialBalance: 1_000,
      feeRate: 0.001,
      slippageRate: 0.001,
      startedAt: new Date('2024-01-01T00:00:00.000Z'),
    })

    const sell = engine.placeOrder({
      order: { symbol: 'AAPL', side: 'SELL', quantity: 1, type: 'MARKET' },
      marketPrice: 100,
    })

    expect(sell.response.status).toBe('REJECTED')
  })

  test('updates cash after buy then sell fill', () => {
    const engine = new PaperTradingEngine({
      initialBalance: 2_000,
      feeRate: 0,
      slippageRate: 0,
      startedAt: new Date('2024-01-01T00:00:00.000Z'),
    })

    engine.placeOrder({
      order: { symbol: 'AAPL', side: 'BUY', quantity: 10, type: 'MARKET' },
      marketPrice: 100,
    })

    engine.placeOrder({
      order: { symbol: 'AAPL', side: 'SELL', quantity: 10, type: 'MARKET' },
      marketPrice: 110,
    })

    expect(engine.getBalance()).toBe(2100)
    expect(engine.getPositions().length).toBe(0)
  })
})
