import { describe, expect, test } from 'bun:test'

import type { BrokerAdapter, Position } from '@alphix/shared'

import {
  BrokerReadServiceError,
  createBrokerReadBalanceService,
  createBrokerReadPositionsService,
} from './broker-read-service'

const identity = {
  email: 'user@alphix.kr',
  isMockSession: false,
} as const

const runtimeConfig = {
  id: 7,
  userId: 3,
  brokerType: 'alpaca',
  isActive: true,
  encryptedApiKey: 'encrypted-api-key',
  encryptedSecret: 'encrypted-secret',
} as const

describe('createBrokerReadPositionsService', () => {
  test('returns adapter-backed positions and disconnects after success', async () => {
    const positions: Position[] = [
      {
        symbol: 'AAPL',
        quantity: 2,
        avgPrice: 100,
        currentPrice: 110,
        pnl: 20,
        pnlPercent: 10,
      },
    ]
    const events: string[] = []

    const service = createBrokerReadPositionsService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {
            events.push('connect')
          },
          async getPositions() {
            events.push('getPositions')
            return positions
          },
          async disconnect() {
            events.push('disconnect')
          },
        }),
    })

    expect(await service(identity)).toEqual(positions)
    expect(events).toEqual(['connect', 'getPositions', 'disconnect'])
  })

  test('returns 409 when encrypted credentials are missing', async () => {
    const service = createBrokerReadPositionsService({
      resolveRuntimeConfig: async () => ({
        ...runtimeConfig,
        encryptedSecret: null,
      }),
    })

    await expectServiceError(
      service(identity),
      409,
      'Broker reads are unavailable: active broker config is missing encrypted secret',
    )
  })

  test('returns 409 when broker config is inactive', async () => {
    const service = createBrokerReadPositionsService({
      resolveRuntimeConfig: async () => ({
        ...runtimeConfig,
        isActive: false,
      }),
    })

    await expectServiceError(
      service(identity),
      409,
      'Broker reads are unavailable: active broker config is required',
    )
  })

  test('returns 409 when stored broker type is unsupported', async () => {
    const service = createBrokerReadPositionsService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () => {
        throw new Error('Unsupported broker type: legacy-broker')
      },
    })

    await expectServiceError(
      service(identity),
      409,
      'Broker reads are unavailable: stored broker type is unsupported',
    )
  })

  test('returns 503 when encryption key is invalid', async () => {
    const service = createBrokerReadPositionsService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => {
        throw new BrokerReadServiceError(
          503,
          'Broker reads are unavailable: ENCRYPTION_KEY must be 32 bytes',
        )
      },
    })

    await expectServiceError(
      service(identity),
      503,
      'Broker reads are unavailable: ENCRYPTION_KEY must be 32 bytes',
    )
  })

  test('returns 500 when ciphertext cannot be decrypted without leaking blobs', async () => {
    const service = createBrokerReadPositionsService({
      resolveRuntimeConfig: async () => ({
        ...runtimeConfig,
        encryptedApiKey: '{"ciphertext":"secret-blob"}',
      }),
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: () => {
        throw new Error('Invalid encrypted data payload: {"ciphertext":"secret-blob"}')
      },
    })

    try {
      await service(identity)
      throw new Error('Expected service to reject')
    } catch (error) {
      expect(error).toBeInstanceOf(BrokerReadServiceError)
      expect((error as BrokerReadServiceError).status).toBe(500)
      expect((error as BrokerReadServiceError).message).toBe(
        'Broker credentials could not be decrypted',
      )
      expect((error as BrokerReadServiceError).message.includes('secret-blob')).toBe(false)
    }
  })

  test('returns 502 for broker failures and still disconnects without leaking headers', async () => {
    const events: string[] = []

    const service = createBrokerReadPositionsService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {
            events.push('connect')
            throw new Error('Authorization: Bearer top-secret-token')
          },
          async disconnect() {
            events.push('disconnect')
          },
        }),
    })

    try {
      await service(identity)
      throw new Error('Expected service to reject')
    } catch (error) {
      expect(error).toBeInstanceOf(BrokerReadServiceError)
      expect((error as BrokerReadServiceError).status).toBe(502)
      expect((error as BrokerReadServiceError).message).toBe('Broker positions could not be loaded')
      expect((error as BrokerReadServiceError).message.includes('Authorization')).toBe(false)
      expect((error as BrokerReadServiceError).message.includes('top-secret-token')).toBe(false)
    }

    expect(events).toEqual(['connect', 'disconnect'])
  })

  test('returns 502 when getPositions fails and still disconnects', async () => {
    const events: string[] = []

    const service = createBrokerReadPositionsService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {
            events.push('connect')
          },
          async getPositions() {
            events.push('getPositions')
            throw new Error('provider timeout')
          },
          async disconnect() {
            events.push('disconnect')
          },
        }),
    })

    await expectServiceError(service(identity), 502, 'Broker positions could not be loaded')
    expect(events).toEqual(['connect', 'getPositions', 'disconnect'])
  })

  test('returns 502 when disconnect fails after a successful read', async () => {
    const service = createBrokerReadPositionsService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {},
          async getPositions() {
            return []
          },
          async disconnect() {
            throw new Error('socket cleanup failed')
          },
        }),
    })

    await expectServiceError(
      service(identity),
      502,
      'Broker connection could not be closed cleanly',
    )
  })
})

describe('createBrokerReadBalanceService', () => {
  test('returns adapter-backed balance and disconnects after success', async () => {
    const events: string[] = []
    const service = createBrokerReadBalanceService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {
            events.push('connect')
          },
          async getBalance() {
            events.push('getBalance')
            return {
              total: 1200,
              available: 900,
              currency: 'USD',
            }
          },
          async disconnect() {
            events.push('disconnect')
          },
        }),
    })

    const balance = await service(identity)

    expect(balance).toEqual({
      total: 1200,
      available: 900,
      currency: 'USD',
    })
    expect(events).toEqual(['connect', 'getBalance', 'disconnect'])
  })

  test('returns 502 when getBalance fails and still disconnects', async () => {
    const events: string[] = []
    const service = createBrokerReadBalanceService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {
            events.push('connect')
          },
          async getBalance() {
            events.push('getBalance')
            throw new Error('upstream timeout')
          },
          async disconnect() {
            events.push('disconnect')
          },
        }),
    })

    await expectServiceError(service(identity), 502, 'Broker balance could not be loaded')
    expect(events).toEqual(['connect', 'getBalance', 'disconnect'])
  })
})

function createAdapterDouble(overrides: Partial<BrokerAdapter>): BrokerAdapter {
  return {
    connect: overrides.connect ?? (async () => {}),
    disconnect: overrides.disconnect ?? (async () => {}),
    getBalance: overrides.getBalance ?? (async () => ({ total: 0, available: 0, currency: 'USD' })),
    getPositions: overrides.getPositions ?? (async () => []),
    placeOrder:
      overrides.placeOrder ??
      (async () => ({ orderId: '1', status: 'SUBMITTED', filledQuantity: 0, filledPrice: 0 })),
    cancelOrder: overrides.cancelOrder ?? (async () => {}),
    getMarketData:
      overrides.getMarketData ??
      (async () => ({
        symbol: 'AAPL',
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        timestamp: new Date(0),
      })),
  }
}

async function expectServiceError(
  promise: Promise<unknown>,
  status: number,
  message: string,
): Promise<void> {
  try {
    await promise
    throw new Error('Expected service to reject')
  } catch (error) {
    expect(error).toBeInstanceOf(BrokerReadServiceError)
    expect((error as BrokerReadServiceError).status).toBe(status)
    expect((error as BrokerReadServiceError).message).toBe(message)
  }
}
