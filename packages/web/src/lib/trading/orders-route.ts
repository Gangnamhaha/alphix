import { NextRequest, NextResponse } from 'next/server'

import type { BrokerOrder, OrderRequest } from '@alphix/shared'

import {
  BrokerSettingsServiceError,
  type BrokerSettingsIdentity,
} from '@/lib/settings/broker-settings'

import { BrokerReadServiceError, getBrokerBackedOrders } from './broker-read-service'
import { resolveAuthenticatedIdentity, type TradingAuthDeps } from './auth'
import { BrokerOrderServiceError, placeBrokerBackedOrder } from './broker-order-service'

interface CreateOrderInput {
  symbol: string
  side: 'buy' | 'sell'
  orderType: 'market' | 'limit'
  quantity: number
  price: number | null
}

export interface TradingOrdersRouteDeps extends TradingAuthDeps {
  getBrokerOrders?: (identity: BrokerSettingsIdentity) => Promise<BrokerOrder[]>
  submitBrokerOrder?: (
    identity: BrokerSettingsIdentity,
    order: OrderRequest,
  ) => Promise<{
    orderId: string
    status: string
    filledQuantity: number
    filledPrice: number
  }>
  now?: () => Date
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readCreateOrderInput(
  request: NextRequest,
): Promise<CreateOrderInput | NextResponse> {
  let payload: unknown

  try {
    payload = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!isRecord(payload)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const symbol = typeof payload.symbol === 'string' ? payload.symbol.trim().toUpperCase() : ''

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
  }

  if (payload.side !== 'buy' && payload.side !== 'sell') {
    return NextResponse.json({ error: 'Valid side is required' }, { status: 400 })
  }

  if (
    payload.orderType !== undefined &&
    payload.orderType !== 'market' &&
    payload.orderType !== 'limit'
  ) {
    return NextResponse.json({ error: 'Valid orderType is required' }, { status: 400 })
  }

  if (
    typeof payload.quantity !== 'number' ||
    !Number.isFinite(payload.quantity) ||
    payload.quantity <= 0
  ) {
    return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
  }

  const orderType = payload.orderType ?? 'market'

  if (payload.price !== undefined && payload.price !== null) {
    if (
      typeof payload.price !== 'number' ||
      !Number.isFinite(payload.price) ||
      payload.price <= 0
    ) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }
  }

  if (orderType === 'limit' && (typeof payload.price !== 'number' || payload.price <= 0)) {
    return NextResponse.json({ error: 'Limit order price is required' }, { status: 400 })
  }

  if (orderType === 'market' && payload.price !== undefined && payload.price !== null) {
    return NextResponse.json({ error: 'Market orders cannot include price' }, { status: 400 })
  }

  return {
    symbol,
    side: payload.side,
    orderType,
    quantity: payload.quantity,
    price: payload.price ?? null,
  }
}

function toBrokerOrder(input: CreateOrderInput): OrderRequest {
  const order: OrderRequest = {
    symbol: input.symbol,
    side: input.side === 'buy' ? 'BUY' : 'SELL',
    quantity: input.quantity,
    type: input.orderType === 'limit' ? 'LIMIT' : 'MARKET',
  }

  if (input.orderType === 'limit' && input.price !== null) {
    order.price = input.price
  }

  return order
}

function mapOrderStatus(
  status: string,
  invalidError: Error = new BrokerOrderServiceError(502, 'Broker order could not be submitted'),
) {
  switch (status) {
    case 'PENDING':
    case 'SUBMITTED':
      return 'pending'
    case 'FILLED':
      return 'filled'
    case 'PARTIALLY_FILLED':
      return 'partially_filled'
    case 'CANCELLED':
      return 'cancelled'
    case 'REJECTED':
      return 'rejected'
    default:
      throw invalidError
  }
}

function toOrderResponse(order: BrokerOrder) {
  return {
    id: order.orderId,
    symbol: order.symbol,
    side: order.side === 'BUY' ? 'buy' : 'sell',
    orderType: order.type === 'LIMIT' ? 'limit' : 'market',
    quantity: order.quantity,
    price: order.price,
    status: mapOrderStatus(
      order.status,
      new BrokerReadServiceError(502, 'Broker orders could not be loaded'),
    ),
    filledQuantity: order.filledQuantity,
    filledPrice: order.filledPrice,
    createdAt: order.createdAt.toISOString(),
  }
}

export function createTradingOrdersPostHandler(deps: TradingOrdersRouteDeps = {}) {
  const submitBrokerOrder = deps.submitBrokerOrder ?? placeBrokerBackedOrder
  const now = deps.now ?? (() => new Date())

  return async function POST(request: NextRequest) {
    try {
      const identity = await resolveAuthenticatedIdentity(request, deps)

      if (identity instanceof NextResponse) {
        return identity
      }

      const input = await readCreateOrderInput(request)

      if (input instanceof NextResponse) {
        return input
      }

      const order = await submitBrokerOrder(identity, toBrokerOrder(input))

      return NextResponse.json({
        success: true,
        data: {
          order: {
            id: order.orderId,
            symbol: input.symbol,
            side: input.side,
            orderType: input.orderType,
            quantity: input.quantity,
            price: input.price,
            status: mapOrderStatus(order.status),
            createdAt: now().toISOString(),
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

export function createTradingOrdersGetHandler(deps: TradingOrdersRouteDeps = {}) {
  const getBrokerOrders = deps.getBrokerOrders ?? getBrokerBackedOrders

  return async function GET(request: NextRequest) {
    try {
      const identity = await resolveAuthenticatedIdentity(request, deps)

      if (identity instanceof NextResponse) {
        return identity
      }

      const orders = await getBrokerOrders(identity)

      return NextResponse.json({
        success: true,
        data: {
          orders: orders.map(toOrderResponse),
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
