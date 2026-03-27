import { NextRequest, NextResponse } from 'next/server'

import {
  BrokerSettingsServiceError,
  type BrokerSettingsIdentity,
} from '@/lib/settings/broker-settings'

import { resolveAuthenticatedIdentity, type TradingAuthDeps } from './auth'
import { BrokerOrderServiceError, cancelBrokerBackedOrder } from './broker-order-service'

export interface TradingOrderDeleteContext {
  params: Promise<{
    id: string
  }>
}

export interface TradingOrderRouteDeps extends TradingAuthDeps {
  cancelBrokerOrder?: (identity: BrokerSettingsIdentity, orderId: string) => Promise<void>
  now?: () => Date
}

export function createTradingOrderDeleteHandler(deps: TradingOrderRouteDeps = {}) {
  const cancelBrokerOrder = deps.cancelBrokerOrder ?? cancelBrokerBackedOrder
  const now = deps.now ?? (() => new Date())

  return async function DELETE(request: NextRequest, context: TradingOrderDeleteContext) {
    try {
      const identity = await resolveAuthenticatedIdentity(request, deps)

      if (identity instanceof NextResponse) {
        return identity
      }

      const { id } = await context.params
      const orderId = id.trim()

      if (!orderId) {
        return NextResponse.json({ error: 'Order id is required' }, { status: 400 })
      }

      await cancelBrokerOrder(identity, orderId)

      return NextResponse.json({
        success: true,
        data: {
          order: {
            id: orderId,
            status: 'cancelled',
            cancelledAt: now().toISOString(),
          },
        },
      })
    } catch (error) {
      if (error instanceof BrokerOrderServiceError || error instanceof BrokerSettingsServiceError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }

      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
  }
}
