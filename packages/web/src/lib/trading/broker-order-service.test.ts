import { describe, expect, test } from 'bun:test'

import type { BrokerAdapter, OrderResponse } from '@alphix/shared'

import { BrokerSettingsServiceError } from '@/lib/settings/broker-settings'

import {
  BrokerOrderServiceError,
  createBrokerCancelOrderService,
  createBrokerPlaceOrderService,
} from './broker-order-service'

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

describe('createBrokerPlaceOrderService', () => {
  test('returns adapter-backed order submission and disconnects after success', async () => {
    const events: string[] = []
    const orderResponse: OrderResponse = {
      orderId: 'ord_123',
      status: 'SUBMITTED',
      filledQuantity: 0,
      filledPrice: 0,
    }

    const service = createBrokerPlaceOrderService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {
            events.push('connect')
          },
          async placeOrder(order) {
            events.push(`placeOrder:${order.symbol}`)
            return orderResponse
          },
          async disconnect() {
            events.push('disconnect')
          },
        }),
    })

    expect(
      await service(identity, {
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 2,
        price: 101.5,
        type: 'LIMIT',
      }),
    ).toEqual(orderResponse)
    expect(events).toEqual(['connect', 'placeOrder:AAPL', 'disconnect'])
  })

  test('returns 409 when encrypted credentials are missing', async () => {
    const service = createBrokerPlaceOrderService({
      resolveRuntimeConfig: async () => ({
        ...runtimeConfig,
        encryptedSecret: null,
      }),
    })

    await expectServiceError(
      service(identity, {
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 1,
        type: 'MARKET',
      }),
      409,
      'Broker order submission is unavailable: active broker config is missing encrypted secret',
    )
  })

  test('maps mock-session runtime config errors to order-specific wording', async () => {
    const service = createBrokerPlaceOrderService({
      resolveRuntimeConfig: async () => {
        throw new BrokerSettingsServiceError(403, 'Broker reads are unavailable in mock session')
      },
    })

    await expectServiceError(
      service(identity, {
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 1,
        type: 'MARKET',
      }),
      403,
      'Broker order submission is unavailable in mock session',
    )
  })

  test('maps read-prefixed runtime config errors to order-specific wording', async () => {
    const service = createBrokerPlaceOrderService({
      resolveRuntimeConfig: async () => {
        throw new BrokerSettingsServiceError(
          503,
          'Broker reads are unavailable: missing admin Supabase environment',
        )
      },
    })

    await expectServiceError(
      service(identity, {
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 1,
        type: 'MARKET',
      }),
      503,
      'Broker order submission is unavailable: missing admin Supabase environment',
    )
  })

  test('returns 500 when ciphertext cannot be decrypted without leaking blobs', async () => {
    const service = createBrokerPlaceOrderService({
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
      await service(identity, {
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 1,
        type: 'MARKET',
      })
      throw new Error('Expected service to reject')
    } catch (error) {
      if (!(error instanceof BrokerOrderServiceError)) {
        throw error
      }

      expect(error.status).toBe(500)
      expect(error.message).toBe('Broker credentials could not be decrypted')
      expect(error.message.includes('secret-blob')).toBe(false)
    }
  })

  test('returns 502 when placeOrder fails and still disconnects', async () => {
    const events: string[] = []
    const service = createBrokerPlaceOrderService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {
            events.push('connect')
          },
          async placeOrder() {
            events.push('placeOrder')
            throw new Error('Authorization: Bearer top-secret-token')
          },
          async disconnect() {
            events.push('disconnect')
          },
        }),
    })

    await expectServiceError(
      service(identity, {
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 1,
        type: 'MARKET',
      }),
      502,
      'Broker order could not be submitted',
    )
    expect(events).toEqual(['connect', 'placeOrder', 'disconnect'])
  })

  test('preserves a successful placeOrder result when disconnect fails afterward', async () => {
    const events: string[] = []
    const service = createBrokerPlaceOrderService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {
            events.push('connect')
          },
          async placeOrder(order) {
            events.push(`placeOrder:${order.symbol}`)
            return {
              orderId: 'ord_123',
              status: 'SUBMITTED',
              filledQuantity: 0,
              filledPrice: 0,
            }
          },
          async disconnect() {
            events.push('disconnect')
            throw new Error('socket cleanup failed')
          },
        }),
    })

    expect(
      await service(identity, {
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 1,
        type: 'MARKET',
      }),
    ).toEqual({
      orderId: 'ord_123',
      status: 'SUBMITTED',
      filledQuantity: 0,
      filledPrice: 0,
    })
    expect(events).toEqual(['connect', 'placeOrder:AAPL', 'disconnect'])
  })
})

describe('createBrokerCancelOrderService', () => {
  test('cancels broker-backed orders and disconnects after success', async () => {
    const events: string[] = []
    const service = createBrokerCancelOrderService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {
            events.push('connect')
          },
          async cancelOrder(orderId) {
            events.push(`cancelOrder:${orderId}`)
          },
          async disconnect() {
            events.push('disconnect')
          },
        }),
    })

    await service(identity, 'ord_123')

    expect(events).toEqual(['connect', 'cancelOrder:ord_123', 'disconnect'])
  })

  test('returns 409 when stored broker type is unsupported', async () => {
    const service = createBrokerCancelOrderService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () => {
        throw new Error('Unsupported broker type: legacy-broker')
      },
    })

    await expectServiceError(
      service(identity, 'ord_123'),
      409,
      'Broker order cancellation is unavailable: stored broker type is unsupported',
    )
  })

  test('maps read-prefixed runtime config errors to cancellation-specific wording', async () => {
    const service = createBrokerCancelOrderService({
      resolveRuntimeConfig: async () => {
        throw new BrokerSettingsServiceError(
          409,
          'Broker reads are unavailable: no broker config found for this account',
        )
      },
    })

    await expectServiceError(
      service(identity, 'ord_123'),
      409,
      'Broker order cancellation is unavailable: no broker config found for this account',
    )
  })

  test('returns 502 when cancelOrder fails and still disconnects', async () => {
    const events: string[] = []
    const service = createBrokerCancelOrderService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {
            events.push('connect')
          },
          async cancelOrder() {
            events.push('cancelOrder')
            throw new Error('provider timeout')
          },
          async disconnect() {
            events.push('disconnect')
          },
        }),
    })

    await expectServiceError(
      service(identity, 'ord_123'),
      502,
      'Broker order could not be cancelled',
    )
    expect(events).toEqual(['connect', 'cancelOrder', 'disconnect'])
  })

  test('preserves successful cancellation when disconnect fails afterward', async () => {
    const events: string[] = []
    const service = createBrokerCancelOrderService({
      resolveRuntimeConfig: async () => runtimeConfig,
      requireEncryptionKey: () => 'x'.repeat(32),
      decryptCredential: (value) => `${value}-plain`,
      createAdapter: () =>
        createAdapterDouble({
          async connect() {
            events.push('connect')
          },
          async cancelOrder(orderId) {
            events.push(`cancelOrder:${orderId}`)
          },
          async disconnect() {
            events.push('disconnect')
            throw new Error('socket cleanup failed')
          },
        }),
    })

    await service(identity, 'ord_123')

    expect(events).toEqual(['connect', 'cancelOrder:ord_123', 'disconnect'])
  })
})

function createAdapterDouble(overrides: Partial<BrokerAdapter>): BrokerAdapter {
  return {
    connect: overrides.connect ?? (async () => {}),
    disconnect: overrides.disconnect ?? (async () => {}),
    getBalance: overrides.getBalance ?? (async () => ({ total: 0, available: 0, currency: 'USD' })),
    getPositions: overrides.getPositions ?? (async () => []),
    getOrders: overrides.getOrders ?? (async () => []),
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
    if (!(error instanceof BrokerOrderServiceError)) {
      throw error
    }

    expect(error.status).toBe(status)
    expect(error.message).toBe(message)
  }
}
