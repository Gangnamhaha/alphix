import { describe, expect, test } from 'bun:test'
import { NextRequest } from 'next/server'

import { BrokerReadServiceError } from '@/lib/trading/broker-read-service'
import { createTradingPositionsGetHandler } from '@/lib/trading/positions-route'

describe('/api/trading/positions GET', () => {
  test('returns 401 when no authenticated user is available', async () => {
    const handler = createTradingPositionsGetHandler({
      hasPublicSupabaseEnv: () => false,
      isLocalAuthHost: () => false,
    })

    const response = await handler(new NextRequest('http://alphix.kr/api/trading/positions'))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  test('returns 403 for mock sessions using the same mock identity flow as broker settings', async () => {
    const identities: Array<{ email: string; isMockSession: boolean }> = []
    const handler = createTradingPositionsGetHandler({
      hasPublicSupabaseEnv: () => false,
      isLocalAuthHost: () => true,
      getBrokerPositions: async (identity) => {
        identities.push(identity)
        throw new BrokerReadServiceError(403, 'Broker reads are unavailable in mock session')
      },
    })

    const response = await handler(
      new NextRequest('http://localhost/api/trading/positions', {
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

  test('returns adapter-backed positions for authenticated users', async () => {
    const identities: Array<{ email: string; isMockSession: boolean }> = []
    const positions = [
      {
        symbol: 'AAPL',
        quantity: 3,
        avgPrice: 100,
        currentPrice: 115,
        pnl: 45,
        pnlPercent: 15,
      },
    ]
    const handler = createTradingPositionsGetHandler({
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
      getBrokerPositions: async (identity) => {
        identities.push(identity)
        return positions
      },
    })

    const response = await handler(new NextRequest('http://alphix.kr/api/trading/positions'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      data: {
        positions,
      },
    })
    expect(identities).toEqual([{ email: 'trader@alphix.kr', isMockSession: false }])
  })

  test('returns safe service errors without leaking auth headers or secrets', async () => {
    const handler = createTradingPositionsGetHandler({
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
      getBrokerPositions: async () => {
        throw new BrokerReadServiceError(502, 'Broker positions could not be loaded')
      },
    })

    const response = await handler(new NextRequest('http://alphix.kr/api/trading/positions'))
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload).toEqual({ error: 'Broker positions could not be loaded' })
    expect(JSON.stringify(payload).includes('top-secret-token')).toBe(false)
    expect(JSON.stringify(payload).includes('Authorization')).toBe(false)
  })
})
