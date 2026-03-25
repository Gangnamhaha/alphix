import { NextRequest, NextResponse } from 'next/server'

import type { Balance } from '@alphix/shared'

import {
  BrokerSettingsServiceError,
  type BrokerSettingsIdentity,
} from '@/lib/settings/broker-settings'

import { BrokerReadServiceError, getBrokerBackedBalance } from './broker-read-service'
import { resolveAuthenticatedIdentity, type TradingAuthDeps } from './auth'

export interface TradingBalanceRouteDeps extends TradingAuthDeps {
  getBrokerBalance?: (identity: BrokerSettingsIdentity) => Promise<Balance>
  now?: () => Date
}

export function createTradingBalanceGetHandler(deps: TradingBalanceRouteDeps = {}) {
  const getBrokerBalance = deps.getBrokerBalance ?? getBrokerBackedBalance
  const now = deps.now ?? (() => new Date())

  return async function GET(request: NextRequest) {
    try {
      const identity = await resolveAuthenticatedIdentity(request, deps)

      if (identity instanceof NextResponse) {
        return identity
      }

      const balance = await getBrokerBalance(identity)

      return NextResponse.json({
        success: true,
        data: {
          currency: balance.currency,
          total: balance.total,
          available: balance.available,
          updatedAt: now().toISOString(),
        },
      })
    } catch (error) {
      if (error instanceof BrokerReadServiceError || error instanceof BrokerSettingsServiceError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }

      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
  }
}
