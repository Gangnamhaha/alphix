import '../../bun-test'
import { PositionSizer } from '../position-sizer'
import { RiskManager } from '../risk-manager'

describe('RiskManager', () => {
  test('triggers circuit breaker when daily loss limit reached', () => {
    const manager = new RiskManager(undefined, { dailyLossLimitPercent: -0.05 })

    const result = manager.evaluate(
      {
        equity: 100_000,
        dailyPnlPercent: -0.051,
        positions: [],
      },
      {
        symbol: 'AAPL',
        notional: 2_000,
      }
    )

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Daily loss limit reached')
    expect(manager.getCircuitBreaker().isActive()).toBe(true)
  })

  test('enforces position size/count/concentration limits', () => {
    const manager = new RiskManager(undefined, {
      maxPositionSizePercent: 0.2,
      maxPositionCount: 2,
      maxConcentrationPercent: 0.3,
    })

    const tooLarge = manager.evaluate(
      {
        equity: 10_000,
        dailyPnlPercent: 0,
        positions: [],
      },
      {
        symbol: 'TSLA',
        notional: 2_500,
      }
    )
    expect(tooLarge.reason).toBe('Order exceeds max position size')

    const tooManyPositions = manager.evaluate(
      {
        equity: 10_000,
        dailyPnlPercent: 0,
        positions: [
          { symbol: 'AAPL', marketValue: 1_000 },
          { symbol: 'MSFT', marketValue: 1_000 },
        ],
      },
      {
        symbol: 'GOOG',
        notional: 500,
      }
    )
    expect(tooManyPositions.reason).toBe('Max position count exceeded')

    const concentration = manager.evaluate(
      {
        equity: 10_000,
        dailyPnlPercent: 0,
        positions: [{ symbol: 'AAPL', marketValue: 2_900 }],
      },
      {
        symbol: 'AAPL',
        notional: 300,
      }
    )
    expect(concentration.reason).toBe('Concentration limit exceeded')
  })

  test('allows order when under all limits', () => {
    const manager = new RiskManager()

    const result = manager.evaluate(
      {
        equity: 50_000,
        dailyPnlPercent: -0.01,
        positions: [{ symbol: 'AAPL', marketValue: 5_000 }],
      },
      {
        symbol: 'MSFT',
        notional: 2_000,
      }
    )

    expect(result.allowed).toBe(true)
  })

  test('blocks all orders when circuit breaker already active', () => {
    const manager = new RiskManager()
    manager.getCircuitBreaker().trigger('manual')

    const result = manager.evaluate(
      {
        equity: 50_000,
        dailyPnlPercent: 0,
        positions: [],
      },
      {
        symbol: 'AAPL',
        notional: 1_000,
      }
    )

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Circuit breaker active')
  })
})

describe('PositionSizer', () => {
  test('calculates fixed-ratio quantity', () => {
    const sizer = new PositionSizer(0.1)
    const quantity = sizer.calculateQuantity(10_000, 50)
    expect(quantity).toBe(20)
  })

  test('returns zero for invalid inputs', () => {
    const sizer = new PositionSizer()
    expect(sizer.calculateQuantity(0, 10)).toBe(0)
    expect(sizer.calculateQuantity(10_000, 0)).toBe(0)
  })

  test('supports custom fixed ratio', () => {
    const sizer = new PositionSizer(0.05)
    expect(sizer.calculateQuantity(20_000, 100)).toBe(10)
  })
})
