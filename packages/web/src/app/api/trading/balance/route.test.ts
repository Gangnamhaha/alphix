import { describe, expect, test } from 'bun:test'
import { NextRequest } from 'next/server'

import { BrokerReadServiceError } from '@/lib/trading/broker-read-service'
import { createTradingBalanceGetHandler } from '@/lib/trading/balance-route'

describe('/api/trading/balance GET', () => {
  test('returns 401 when no authenticated user is available', async () => {
    const handler = createTradingBalanceGetHandler({
      hasPublicSupabaseEnv: () => false,
      isLocalAuthHost: () => false,
    })

    const response = await handler(new NextRequest('http://alphix.kr/api/trading/balance'))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  test('returns adapter-backed balance for authenticated users', async () => {
    const handler = createTradingBalanceGetHandler({
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
      getBrokerBalance: async () => ({
        total: 5000000,
        available: 3200000,
        currency: 'KRW',
      }),
      now: () => new Date('2026-03-25T00:00:00.000Z'),
    })

    const response = await handler(new NextRequest('http://alphix.kr/api/trading/balance'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      data: {
        currency: 'KRW',
        total: 5000000,
        available: 3200000,
        updatedAt: '2026-03-25T00:00:00.000Z',
      },
    })
  })

  test('returns 403 for mock sessions using the same identity flow as broker settings', async () => {
    const identities: Array<{ email: string; isMockSession: boolean }> = []
    const handler = createTradingBalanceGetHandler({
      hasPublicSupabaseEnv: () => false,
      isLocalAuthHost: () => true,
      getBrokerBalance: async (identity) => {
        identities.push(identity)
        throw new BrokerReadServiceError(403, 'Broker reads are unavailable in mock session')
      },
    })

    const response = await handler(
      new NextRequest('http://localhost/api/trading/balance', {
        headers: {
          cookie: 'mock_session=active; mock_email=mock.user@alphix.kr',
        },
      }),
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      error: 'Broker reads are unavailable in mock session',
    })
    expect(identities).toEqual([{ email: 'mock.user@alphix.kr', isMockSession: true }])
  })

  test('returns safe service errors without leaking sensitive values', async () => {
    const handler = createTradingBalanceGetHandler({
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
      getBrokerBalance: async () => {
        throw new BrokerReadServiceError(502, 'Broker balance could not be loaded')
      },
    })

    const response = await handler(new NextRequest('http://alphix.kr/api/trading/balance'))
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload).toEqual({ error: 'Broker balance could not be loaded' })
    expect(JSON.stringify(payload).includes('top-secret-token')).toBe(false)
    expect(JSON.stringify(payload).includes('Authorization')).toBe(false)
  })
})
