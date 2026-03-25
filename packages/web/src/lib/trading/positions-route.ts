import { NextRequest, NextResponse } from 'next/server'

import type { Position } from '@alphix/shared'

import {
  BrokerSettingsServiceError,
  type BrokerSettingsIdentity,
} from '@/lib/settings/broker-settings'

import { BrokerReadServiceError, getBrokerBackedPositions } from './broker-read-service'
import { resolveAuthenticatedIdentity, type TradingAuthDeps } from './auth'

export interface TradingPositionsRouteDeps extends TradingAuthDeps {
  getBrokerPositions?: (identity: BrokerSettingsIdentity) => Promise<Position[]>
}

export function createTradingPositionsGetHandler(deps: TradingPositionsRouteDeps = {}) {
  const getBrokerPositions = deps.getBrokerPositions ?? getBrokerBackedPositions

  return async function GET(request: NextRequest) {
    try {
      const identity = await resolveAuthenticatedIdentity(request, deps)

      if (identity instanceof NextResponse) {
        return identity
      }

      const positions = await getBrokerPositions(identity)

      return NextResponse.json({
        success: true,
        data: {
          positions,
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
