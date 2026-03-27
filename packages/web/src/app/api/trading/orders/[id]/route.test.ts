import { describe, expect, test } from 'bun:test'
import { NextRequest } from 'next/server'

import { BrokerOrderServiceError } from '@/lib/trading/broker-order-service'
import { createTradingOrderDeleteHandler } from '@/lib/trading/order-route'

describe('/api/trading/orders/[id] DELETE', () => {
  test('returns 401 when no authenticated user is available', async () => {
    const handler = createTradingOrderDeleteHandler({
      hasPublicSupabaseEnv: () => false,
      isLocalAuthHost: () => false,
    })

    const response = await handler(
      new NextRequest('http://alphix.kr/api/trading/orders/ord_123', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'ord_123' }) },
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  test('returns 400 when the route param is empty', async () => {
    const handler = createTradingOrderDeleteHandler({
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
      new NextRequest('http://alphix.kr/api/trading/orders/', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: '   ' }) },
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Order id is required' })
  })

  test('returns 403 for mock sessions using the same identity flow as broker settings', async () => {
    const identities: Array<{ email: string; isMockSession: boolean }> = []
    const cancelledOrderIds: string[] = []
    const handler = createTradingOrderDeleteHandler({
      hasPublicSupabaseEnv: () => false,
      isLocalAuthHost: () => true,
      cancelBrokerOrder: async (identity, orderId) => {
        identities.push(identity)
        cancelledOrderIds.push(orderId)
        throw new BrokerOrderServiceError(
          403,
          'Broker order cancellation is unavailable in mock session',
        )
      },
    })

    const response = await handler(
      new NextRequest('http://localhost/api/trading/orders/ord_123', {
        method: 'DELETE',
        headers: {
          cookie: 'mock_session=active; mock_email=mock.user@alphix.kr',
        },
      }),
      { params: Promise.resolve({ id: 'ord_123' }) },
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      error: 'Broker order cancellation is unavailable in mock session',
    })
    expect(identities).toEqual([{ email: 'mock.user@alphix.kr', isMockSession: true }])
    expect(cancelledOrderIds).toEqual(['ord_123'])
  })

  test('returns adapter-backed order cancellation for authenticated users', async () => {
    const identities: Array<{ email: string; isMockSession: boolean }> = []
    const cancelledOrderIds: string[] = []
    const handler = createTradingOrderDeleteHandler({
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
      cancelBrokerOrder: async (identity, orderId) => {
        identities.push(identity)
        cancelledOrderIds.push(orderId)
      },
      now: () => new Date('2026-03-25T00:00:00.000Z'),
    })

    const response = await handler(
      new NextRequest('http://alphix.kr/api/trading/orders/ord_123', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: ' ord_123 ' }) },
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      data: {
        order: {
          id: 'ord_123',
          status: 'cancelled',
          cancelledAt: '2026-03-25T00:00:00.000Z',
        },
      },
    })
    expect(identities).toEqual([{ email: 'trader@alphix.kr', isMockSession: false }])
    expect(cancelledOrderIds).toEqual(['ord_123'])
  })

  test('returns safe service errors without leaking broker secrets', async () => {
    const handler = createTradingOrderDeleteHandler({
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
      cancelBrokerOrder: async () => {
        throw new BrokerOrderServiceError(502, 'Broker order could not be cancelled')
      },
    })

    const response = await handler(
      new NextRequest('http://alphix.kr/api/trading/orders/ord_123', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'ord_123' }) },
    )
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload).toEqual({ error: 'Broker order could not be cancelled' })
    expect(JSON.stringify(payload).includes('top-secret-token')).toBe(false)
    expect(JSON.stringify(payload).includes('Authorization')).toBe(false)
  })
})
