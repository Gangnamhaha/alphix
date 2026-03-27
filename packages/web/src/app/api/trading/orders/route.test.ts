import { describe, expect, test } from 'bun:test'
import { NextRequest } from 'next/server'

import { BrokerReadServiceError } from '@/lib/trading/broker-read-service'
import { BrokerOrderServiceError } from '@/lib/trading/broker-order-service'
import {
  createTradingOrdersGetHandler,
  createTradingOrdersPostHandler,
} from '@/lib/trading/orders-route'

const validOrderBody = {
  symbol: 'AAPL',
  side: 'buy',
  orderType: 'limit',
  quantity: 2,
  price: 101.5,
}

describe('/api/trading/orders POST', () => {
  test('returns 401 when no authenticated user is available', async () => {
    const handler = createTradingOrdersPostHandler({
      hasPublicSupabaseEnv: () => false,
      isLocalAuthHost: () => false,
    })

    const response = await handler(
      new NextRequest('http://alphix.kr/api/trading/orders', {
        method: 'POST',
        body: JSON.stringify(validOrderBody),
      }),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  test('returns 400 when a limit order is missing a valid price', async () => {
    const handler = createTradingOrdersPostHandler({
      hasPublicSupabaseEnv: () => true,
      createServerSupabaseClient: async () => ({
        auth: {
          getUser: async () => ({
            data: {
              user: {
                email: 'trader@alphix.kr',
              },
            },
          }),
        },
      }),
    })

    const response = await handler(
      new NextRequest('http://alphix.kr/api/trading/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...validOrderBody,
          price: undefined,
        }),
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Limit order price is required' })
  })

  test('returns 400 when a market order includes a price', async () => {
    const handler = createTradingOrdersPostHandler({
      hasPublicSupabaseEnv: () => true,
      createServerSupabaseClient: async () => ({
        auth: {
          getUser: async () => ({
            data: {
              user: {
                email: 'trader@alphix.kr',
              },
            },
          }),
        },
      }),
    })

    const response = await handler(
      new NextRequest('http://alphix.kr/api/trading/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...validOrderBody,
          orderType: 'market',
        }),
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Market orders cannot include price' })
  })

  test('returns 403 for mock sessions using the same identity flow as broker settings', async () => {
    const identities: Array<{ email: string; isMockSession: boolean }> = []
    const handler = createTradingOrdersPostHandler({
      hasPublicSupabaseEnv: () => false,
      isLocalAuthHost: () => true,
      submitBrokerOrder: async (identity) => {
        identities.push(identity)
        throw new BrokerOrderServiceError(
          403,
          'Broker order submission is unavailable in mock session',
        )
      },
    })

    const response = await handler(
      new NextRequest('http://localhost/api/trading/orders', {
        method: 'POST',
        headers: {
          cookie: 'mock_session=active; mock_email=mock.user@alphix.kr',
        },
        body: JSON.stringify(validOrderBody),
      }),
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      error: 'Broker order submission is unavailable in mock session',
    })
    expect(identities).toEqual([{ email: 'mock.user@alphix.kr', isMockSession: true }])
  })

  test('returns adapter-backed order submission for authenticated users', async () => {
    const identities: Array<{ email: string; isMockSession: boolean }> = []
    const submittedOrders: Array<{
      symbol: string
      side: 'BUY' | 'SELL'
      quantity: number
      price?: number
      type: 'MARKET' | 'LIMIT'
    }> = []
    const handler = createTradingOrdersPostHandler({
      hasPublicSupabaseEnv: () => true,
      createServerSupabaseClient: async () => ({
        auth: {
          getUser: async () => ({
            data: {
              user: {
                email: 'Trader@Alphix.kr',
              },
            },
          }),
        },
      }),
      submitBrokerOrder: async (identity, order) => {
        identities.push(identity)
        submittedOrders.push(order)

        return {
          orderId: 'ord_broker_123',
          status: 'SUBMITTED',
          filledQuantity: 0,
          filledPrice: 0,
        }
      },
      now: () => new Date('2026-03-25T00:00:00.000Z'),
    })

    const response = await handler(
      new NextRequest('http://alphix.kr/api/trading/orders', {
        method: 'POST',
        body: JSON.stringify({
          symbol: ' aapl ',
          side: 'buy',
          orderType: 'limit',
          quantity: 2,
          price: 101.5,
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      data: {
        order: {
          id: 'ord_broker_123',
          symbol: 'AAPL',
          side: 'buy',
          orderType: 'limit',
          quantity: 2,
          price: 101.5,
          status: 'pending',
          createdAt: '2026-03-25T00:00:00.000Z',
        },
      },
    })
    expect(identities).toEqual([{ email: 'trader@alphix.kr', isMockSession: false }])
    expect(submittedOrders).toEqual([
      {
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 2,
        price: 101.5,
        type: 'LIMIT',
      },
    ])
  })

  test('returns safe service errors without leaking broker secrets', async () => {
    const handler = createTradingOrdersPostHandler({
      hasPublicSupabaseEnv: () => true,
      createServerSupabaseClient: async () => ({
        auth: {
          getUser: async () => ({
            data: {
              user: {
                email: 'user@alphix.kr',
              },
            },
          }),
        },
      }),
      submitBrokerOrder: async () => {
        throw new BrokerOrderServiceError(502, 'Broker order could not be submitted')
      },
    })

    const response = await handler(
      new NextRequest('http://alphix.kr/api/trading/orders', {
        method: 'POST',
        body: JSON.stringify(validOrderBody),
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload).toEqual({ error: 'Broker order could not be submitted' })
    expect(JSON.stringify(payload).includes('top-secret-token')).toBe(false)
    expect(JSON.stringify(payload).includes('Authorization')).toBe(false)
  })

  test('fails closed when the broker returns an unexpected order status', async () => {
    const handler = createTradingOrdersPostHandler({
      hasPublicSupabaseEnv: () => true,
      createServerSupabaseClient: async () => ({
        auth: {
          getUser: async () => ({
            data: {
              user: {
                email: 'user@alphix.kr',
              },
            },
          }),
        },
      }),
      submitBrokerOrder: async () => ({
        orderId: 'ord_broker_123',
        status: 'UNKNOWN_STATUS',
        filledQuantity: 0,
        filledPrice: 0,
      }),
    })

    const response = await handler(
      new NextRequest('http://alphix.kr/api/trading/orders', {
        method: 'POST',
        body: JSON.stringify(validOrderBody),
      }),
    )

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'Broker order could not be submitted' })
  })
})

describe('/api/trading/orders GET', () => {
  test('returns 401 when no authenticated user is available', async () => {
    const handler = createTradingOrdersGetHandler({
      hasPublicSupabaseEnv: () => false,
      isLocalAuthHost: () => false,
    })

    const response = await handler(new NextRequest('http://alphix.kr/api/trading/orders'))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  test('returns 403 for mock sessions using the same identity flow as broker settings', async () => {
    const identities: Array<{ email: string; isMockSession: boolean }> = []
    const handler = createTradingOrdersGetHandler({
      hasPublicSupabaseEnv: () => false,
      isLocalAuthHost: () => true,
      getBrokerOrders: async (identity) => {
        identities.push(identity)
        throw new BrokerReadServiceError(403, 'Broker reads are unavailable in mock session')
      },
    })

    const response = await handler(
      new NextRequest('http://localhost/api/trading/orders', {
        headers: {
          cookie: 'mock_session=active; mock_email=mock.user@alphix.kr',
        },
      }),
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Broker reads are unavailable in mock session' })
    expect(identities).toEqual([{ email: 'mock.user@alphix.kr', isMockSession: true }])
  })

  test('returns adapter-backed orders for authenticated users', async () => {
    const identities: Array<{ email: string; isMockSession: boolean }> = []
    const handler = createTradingOrdersGetHandler({
      hasPublicSupabaseEnv: () => true,
      createServerSupabaseClient: async () => ({
        auth: {
          getUser: async () => ({
            data: {
              user: {
                email: 'Trader@Alphix.kr',
              },
            },
          }),
        },
      }),
      getBrokerOrders: async (identity) => {
        identities.push(identity)
        return [
          {
            orderId: 'ord_broker_123',
            symbol: 'AAPL',
            side: 'BUY',
            quantity: 2,
            price: 101.5,
            type: 'LIMIT',
            status: 'SUBMITTED',
            filledQuantity: 0,
            filledPrice: 0,
            createdAt: new Date('2026-03-25T00:00:00.000Z'),
          },
          {
            orderId: 'ord_broker_124',
            symbol: 'TSLA',
            side: 'SELL',
            quantity: 1,
            price: null,
            type: 'MARKET',
            status: 'FILLED',
            filledQuantity: 1,
            filledPrice: 190.25,
            createdAt: new Date('2026-03-25T01:00:00.000Z'),
          },
        ]
      },
    })

    const response = await handler(new NextRequest('http://alphix.kr/api/trading/orders'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      data: {
        orders: [
          {
            id: 'ord_broker_123',
            symbol: 'AAPL',
            side: 'buy',
            orderType: 'limit',
            quantity: 2,
            price: 101.5,
            status: 'pending',
            filledQuantity: 0,
            filledPrice: 0,
            createdAt: '2026-03-25T00:00:00.000Z',
          },
          {
            id: 'ord_broker_124',
            symbol: 'TSLA',
            side: 'sell',
            orderType: 'market',
            quantity: 1,
            price: null,
            status: 'filled',
            filledQuantity: 1,
            filledPrice: 190.25,
            createdAt: '2026-03-25T01:00:00.000Z',
          },
        ],
      },
    })
    expect(identities).toEqual([{ email: 'trader@alphix.kr', isMockSession: false }])
  })

  test('returns safe service errors without leaking broker secrets', async () => {
    const handler = createTradingOrdersGetHandler({
      hasPublicSupabaseEnv: () => true,
      createServerSupabaseClient: async () => ({
        auth: {
          getUser: async () => ({
            data: {
              user: {
                email: 'user@alphix.kr',
              },
            },
          }),
        },
      }),
      getBrokerOrders: async () => {
        throw new BrokerReadServiceError(502, 'Broker orders could not be loaded')
      },
    })

    const response = await handler(new NextRequest('http://alphix.kr/api/trading/orders'))
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload).toEqual({ error: 'Broker orders could not be loaded' })
    expect(JSON.stringify(payload).includes('top-secret-token')).toBe(false)
    expect(JSON.stringify(payload).includes('Authorization')).toBe(false)
  })

  test('fails closed when the broker returns an unexpected listed order status', async () => {
    const invalidOrders = JSON.parse(`[
      {
        "orderId": "ord_broker_123",
        "symbol": "AAPL",
        "side": "BUY",
        "quantity": 2,
        "price": 101.5,
        "type": "LIMIT",
        "status": "UNKNOWN_STATUS",
        "filledQuantity": 0,
        "filledPrice": 0,
        "createdAt": "2026-03-25T00:00:00.000Z"
      }
    ]`)
    invalidOrders[0].createdAt = new Date(invalidOrders[0].createdAt)

    const handler = createTradingOrdersGetHandler({
      hasPublicSupabaseEnv: () => true,
      createServerSupabaseClient: async () => ({
        auth: {
          getUser: async () => ({
            data: {
              user: {
                email: 'user@alphix.kr',
              },
            },
          }),
        },
      }),
      getBrokerOrders: async () => invalidOrders,
    })

    const response = await handler(new NextRequest('http://alphix.kr/api/trading/orders'))

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'Broker orders could not be loaded' })
  })
})
