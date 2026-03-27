import type { BrokerAdapter, BrokerType } from '@alphix/shared'
import { decryptFromString } from '@alphix/shared'
import { createBrokerAdapter } from '@alphix/trading-engine'

import {
  BrokerSettingsServiceError,
  getBrokerRuntimeConfig,
  requireBrokerRuntimeEncryptionKey,
  type BrokerRuntimeConfig,
  type BrokerSettingsIdentity,
} from '@/lib/settings/broker-settings'

export class BrokerReadServiceError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'BrokerReadServiceError'
    this.status = status
  }
}

type BrokerReadKind = 'positions' | 'balance' | 'orders'

interface BrokerReadServiceDeps {
  resolveRuntimeConfig?: (identity: BrokerSettingsIdentity) => Promise<BrokerRuntimeConfig>
  requireEncryptionKey?: () => string
  decryptCredential?: (value: string, key: string) => string
  createAdapter?: (type: BrokerType, config: { apiKey: string; secretKey: string }) => BrokerAdapter
}

function ensureEncryptedCredential(value: string | null, field: 'apiKey' | 'secret') {
  if (!value) {
    throw new BrokerReadServiceError(
      409,
      `Broker reads are unavailable: active broker config is missing encrypted ${field}`,
    )
  }

  return value
}

function ensureActiveConfig(config: BrokerRuntimeConfig) {
  if (!config.isActive) {
    throw new BrokerReadServiceError(
      409,
      'Broker reads are unavailable: active broker config is required',
    )
  }
}

function isUnsupportedBrokerError(error: unknown) {
  return error instanceof Error && error.message.startsWith('Unsupported broker type:')
}

function createBrokerReadFailure(kind: BrokerReadKind) {
  switch (kind) {
    case 'positions':
      return new BrokerReadServiceError(502, 'Broker positions could not be loaded')
    case 'balance':
      return new BrokerReadServiceError(502, 'Broker balance could not be loaded')
    case 'orders':
      return new BrokerReadServiceError(502, 'Broker orders could not be loaded')
  }
}

function createBrokerReadService<T>(
  kind: BrokerReadKind,
  deps: BrokerReadServiceDeps,
  read: (adapter: BrokerAdapter) => Promise<T>,
) {
  const resolveRuntimeConfig = deps.resolveRuntimeConfig ?? getBrokerRuntimeConfig
  const requireEncryptionKey = deps.requireEncryptionKey ?? requireBrokerRuntimeEncryptionKey
  const decryptCredential = deps.decryptCredential ?? decryptFromString
  const createAdapter = deps.createAdapter ?? createBrokerAdapter

  return async function runBrokerRead(identity: BrokerSettingsIdentity): Promise<T> {
    let adapter: BrokerAdapter | null = null
    let result: T | null = null
    let pendingError: BrokerReadServiceError | BrokerSettingsServiceError | null = null

    try {
      const config = await resolveRuntimeConfig(identity)
      ensureActiveConfig(config)

      const encryptedApiKey = ensureEncryptedCredential(config.encryptedApiKey, 'apiKey')
      const encryptedSecret = ensureEncryptedCredential(config.encryptedSecret, 'secret')
      const encryptionKey = requireEncryptionKey()

      let apiKey: string
      let secretKey: string

      try {
        apiKey = decryptCredential(encryptedApiKey, encryptionKey)
        secretKey = decryptCredential(encryptedSecret, encryptionKey)
      } catch {
        throw new BrokerReadServiceError(500, 'Broker credentials could not be decrypted')
      }

      try {
        const nextAdapter = createAdapter(config.brokerType, {
          apiKey,
          secretKey,
        })
        adapter = nextAdapter
      } catch (error) {
        if (isUnsupportedBrokerError(error)) {
          throw new BrokerReadServiceError(
            409,
            'Broker reads are unavailable: stored broker type is unsupported',
          )
        }

        throw createBrokerReadFailure(kind)
      }

      await adapter.connect()
      result = await read(adapter)
    } catch (error) {
      if (error instanceof BrokerReadServiceError || error instanceof BrokerSettingsServiceError) {
        pendingError = error
      } else {
        pendingError = createBrokerReadFailure(kind)
      }
    } finally {
      if (adapter) {
        try {
          await adapter.disconnect()
        } catch {
          if (!pendingError) {
            pendingError = new BrokerReadServiceError(
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

    if (result === null) {
      throw createBrokerReadFailure(kind)
    }

    return result
  }
}

export function createBrokerReadPositionsService(deps: BrokerReadServiceDeps = {}) {
  return createBrokerReadService('positions', deps, async (adapter) => adapter.getPositions())
}

export const getBrokerBackedPositions = createBrokerReadPositionsService()

export function createBrokerReadBalanceService(deps: BrokerReadServiceDeps = {}) {
  return createBrokerReadService('balance', deps, async (adapter) => adapter.getBalance())
}

export const getBrokerBackedBalance = createBrokerReadBalanceService()

export function createBrokerReadOrdersService(deps: BrokerReadServiceDeps = {}) {
  return createBrokerReadService('orders', deps, async (adapter) => adapter.getOrders())
}

export const getBrokerBackedOrders = createBrokerReadOrdersService()
