import '../../bun-test'
import type { OrderRequest, OrderResponse } from '@alphix/shared'
import { OrderManager } from '../order-manager'
import { OrderValidator } from '../order-validator'

describe('OrderValidator', () => {
  test('rejects out-of-range quantity and market close', () => {
    const validator = new OrderValidator({ minQuantity: 1, maxQuantity: 10 })

    const tooSmall = validator.validate(order({ quantity: 0.5 }), context())
    expect(tooSmall.valid).toBe(false)

    const marketClosed = validator.validate(order({ quantity: 2 }), context({ isMarketOpen: false }))
    expect(marketClosed.reason).toBe('Market is closed')
  })

  test('rejects insufficient balance and circuit breaker', () => {
    const validator = new OrderValidator()

    const balanceFail = validator.validate(order({ quantity: 5, price: 100, type: 'LIMIT' }), context({ availableBalance: 100 }))
    expect(balanceFail.reason).toBe('Insufficient balance')

    const cbFail = validator.validate(order(), context({ isCircuitBreakerActive: true }))
    expect(cbFail.reason).toBe('Circuit breaker active')
  })
})

describe('OrderManager', () => {
  test('runs order lifecycle from pending to filled', async () => {
    const manager = new OrderManager({
      executeOrder: async (request) => {
        const response: OrderResponse = {
          orderId: 'broker-1',
          status: 'FILLED',
          filledQuantity: request.quantity,
          filledPrice: 50,
        }
        return response
      },
    })

    const created = await manager.createOrder(order({ quantity: 3, price: 50, type: 'LIMIT' }), 'idem-1', context({ availableBalance: 1000 }))

    expect(created.status).toBe('FILLED')
    expect(created.filledQuantity).toBe(3)
    expect(manager.getOrders().length).toBe(1)
  })

  test('returns same order for duplicate idempotency key', async () => {
    const manager = new OrderManager({ executeOrder: resolveFilled })

    const first = await manager.createOrder(order(), 'dup-key', context())
    const second = await manager.createOrder(order({ quantity: 2 }), 'dup-key', context())

    expect(first.orderId).toBe(second.orderId)
    expect(manager.getOrders().length).toBe(1)
  })

  test('rejects invalid order and can cancel submitted order', async () => {
    const manager = new OrderManager({
      executeOrder: async () => ({
        orderId: 'submitted-1',
        status: 'SUBMITTED',
        filledQuantity: 0,
        filledPrice: 0,
      }),
    })

    const rejected = await manager.createOrder(order({ quantity: 1000, price: 100, type: 'LIMIT' }), 'rej', context({ availableBalance: 100 }))
    expect(rejected.status).toBe('REJECTED')

    const submitted = await manager.createOrder(order({ quantity: 1, price: 10, type: 'LIMIT' }), 'sub', context({ availableBalance: 1000 }))
    const cancelled = manager.cancelOrder(submitted.orderId)
    expect(cancelled.status).toBe('CANCELLED')
  })

  test('marks order rejected when execution throws', async () => {
    const manager = new OrderManager({
      executeOrder: async () => {
        throw new Error('execution down')
      },
    })

    const result = await manager.createOrder(order(), 'err-key', context())
    expect(result.status).toBe('REJECTED')
    expect(result.rejectionReason).toBe('execution down')
  })

  test('does not cancel already filled order', async () => {
    const manager = new OrderManager({ executeOrder: resolveFilled })
    const filled = await manager.createOrder(order(), 'filled', context())

    const afterCancel = manager.cancelOrder(filled.orderId)
    expect(afterCancel.status).toBe('FILLED')
  })
})

function order(overrides: Partial<OrderRequest> = {}): OrderRequest {
  return {
    symbol: 'AAPL',
    side: 'BUY',
    quantity: 1,
    type: 'MARKET',
    ...overrides,
  }
}

function context(overrides: Partial<Parameters<OrderValidator['validate']>[1]> = {}): Parameters<OrderValidator['validate']>[1] {
  return {
    availableBalance: 10_000,
    marketPriceBySymbol: { AAPL: 100, BTCUSDT: 100 },
    isMarketOpen: true,
    isCircuitBreakerActive: false,
    ...overrides,
  }
}

async function resolveFilled(request: OrderRequest): Promise<OrderResponse> {
  return {
    orderId: `ext-${request.symbol}`,
    status: 'FILLED',
    filledQuantity: request.quantity,
    filledPrice: request.price ?? 100,
  }
}
