import type { BrokerAdapter, BrokerType, OrderRequest } from '@alphix/shared'
import { decryptFromString } from '@alphix/shared'
import { createBrokerAdapter } from '@alphix/trading-engine'

import {
  BrokerSettingsServiceError,
  getBrokerRuntimeConfig,
  requireBrokerRuntimeEncryptionKey,
  type BrokerRuntimeConfig,
  type BrokerSettingsIdentity,
} from '@/lib/settings/broker-settings'

export class BrokerOrderServiceError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'BrokerOrderServiceError'
    this.status = status
  }
}

type BrokerOrderKind = 'place' | 'cancel'

interface BrokerOrderServiceDeps {
  resolveRuntimeConfig?: (identity: BrokerSettingsIdentity) => Promise<BrokerRuntimeConfig>
  requireEncryptionKey?: () => string
  decryptCredential?: (value: string, key: string) => string
  createAdapter?: (type: BrokerType, config: { apiKey: string; secretKey: string }) => BrokerAdapter
}

const BROKER_READS_UNAVAILABLE_PREFIX = 'Broker reads are unavailable'

function createUnavailablePrefix(kind: BrokerOrderKind) {
  return kind === 'place'
    ? 'Broker order submission is unavailable'
    : 'Broker order cancellation is unavailable'
}

function ensureEncryptedCredential(
  value: string | null,
  field: 'apiKey' | 'secret',
  kind: BrokerOrderKind,
) {
  if (!value) {
    throw new BrokerOrderServiceError(
      409,
      `${createUnavailablePrefix(kind)}: active broker config is missing encrypted ${field}`,
    )
  }

  return value
}

function ensureActiveConfig(config: BrokerRuntimeConfig, kind: BrokerOrderKind) {
  if (!config.isActive) {
    throw new BrokerOrderServiceError(
      409,
      `${createUnavailablePrefix(kind)}: active broker config is required`,
    )
  }
}

function isUnsupportedBrokerError(error: unknown) {
  return error instanceof Error && error.message.startsWith('Unsupported broker type:')
}

function createBrokerOrderFailure(kind: BrokerOrderKind) {
  return new BrokerOrderServiceError(
    502,
    kind === 'place'
      ? 'Broker order could not be submitted'
      : 'Broker order could not be cancelled',
  )
}

function mapBrokerSettingsError(kind: BrokerOrderKind, error: BrokerSettingsServiceError) {
  if (error.message === `${BROKER_READS_UNAVAILABLE_PREFIX} in mock session`) {
    return new BrokerOrderServiceError(
      error.status,
      `${createUnavailablePrefix(kind)} in mock session`,
    )
  }

  if (error.message.startsWith(`${BROKER_READS_UNAVAILABLE_PREFIX}:`)) {
    return new BrokerOrderServiceError(
      error.status,
      `${createUnavailablePrefix(kind)}${error.message.slice(BROKER_READS_UNAVAILABLE_PREFIX.length)}`,
    )
  }

  return new BrokerOrderServiceError(error.status, error.message)
}

function createBrokerOrderService<Input, Output>(
  kind: BrokerOrderKind,
  deps: BrokerOrderServiceDeps,
  execute: (adapter: BrokerAdapter, input: Input) => Promise<Output>,
) {
  const resolveRuntimeConfig = deps.resolveRuntimeConfig ?? getBrokerRuntimeConfig
  const requireEncryptionKey = deps.requireEncryptionKey ?? requireBrokerRuntimeEncryptionKey
  const decryptCredential = deps.decryptCredential ?? decryptFromString
  const createAdapter = deps.createAdapter ?? createBrokerAdapter
  const noResult = Symbol('no-result')

  return async function runBrokerOrder(
    identity: BrokerSettingsIdentity,
    input: Input,
  ): Promise<Output> {
    let adapter: BrokerAdapter | null = null
    let result: Output | typeof noResult = noResult
    let pendingError: BrokerOrderServiceError | BrokerSettingsServiceError | null = null

    try {
      const config = await resolveRuntimeConfig(identity)
      ensureActiveConfig(config, kind)

      const encryptedApiKey = ensureEncryptedCredential(config.encryptedApiKey, 'apiKey', kind)
      const encryptedSecret = ensureEncryptedCredential(config.encryptedSecret, 'secret', kind)
      const encryptionKey = requireEncryptionKey()

      let apiKey: string
      let secretKey: string

      try {
        apiKey = decryptCredential(encryptedApiKey, encryptionKey)
        secretKey = decryptCredential(encryptedSecret, encryptionKey)
      } catch (error) {
        throw new BrokerOrderServiceError(500, 'Broker credentials could not be decrypted')
      }

      try {
        adapter = createAdapter(config.brokerType, {
          apiKey,
          secretKey,
        })
      } catch (error) {
        if (isUnsupportedBrokerError(error)) {
          throw new BrokerOrderServiceError(
            409,
            `${createUnavailablePrefix(kind)}: stored broker type is unsupported`,
          )
        }

        throw createBrokerOrderFailure(kind)
      }

      await adapter.connect()
      result = await execute(adapter, input)
    } catch (error) {
      if (error instanceof BrokerOrderServiceError) {
        pendingError = error
      } else if (error instanceof BrokerSettingsServiceError) {
        pendingError = mapBrokerSettingsError(kind, error)
      } else {
        pendingError = createBrokerOrderFailure(kind)
      }
    } finally {
      if (adapter) {
        try {
          await adapter.disconnect()
        } catch (error) {
          if (!pendingError && result === noResult) {
            pendingError = new BrokerOrderServiceError(
              502,
              'Broker connection could not be closed cleanly',
            )
          }
        }
      }
    }

    if (pendingError) {
      throw pendingError
    }

    if (result === noResult) {
      throw createBrokerOrderFailure(kind)
    }

    return result
  }
}

export function createBrokerPlaceOrderService(deps: BrokerOrderServiceDeps = {}) {
  return createBrokerOrderService('place', deps, async (adapter, order: OrderRequest) =>
    adapter.placeOrder(order),
  )
}

export const placeBrokerBackedOrder = createBrokerPlaceOrderService()

export function createBrokerCancelOrderService(deps: BrokerOrderServiceDeps = {}) {
  return createBrokerOrderService('cancel', deps, async (adapter, orderId: string) => {
    await adapter.cancelOrder(orderId)
  })
}

export const cancelBrokerBackedOrder = createBrokerCancelOrderService()
