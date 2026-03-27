import type {
  Balance,
  BrokerOrder,
  MarketData,
  OrderRequest,
  OrderResponse,
  Position,
} from '@alphix/shared'
import { BaseKisBrokerAdapter, NetworkSimulationError } from '../kis/base'

export class KisOverseasBrokerAdapter extends BaseKisBrokerAdapter {
  constructor(config: { apiKey: string; secretKey: string; isPaper?: boolean }) {
    super(config)
  }

  async getBalance(): Promise<Balance> {
    return this.authenticatedRequest(async () => {
      await wait(8)
      return {
        total: 75_000,
        available: 24_500,
        currency: 'USD',
      }
    })
  }

  async getPositions(): Promise<Position[]> {
    return this.authenticatedRequest(async () => {
      await wait(8)
      return [
        {
          symbol: 'AAPL',
          quantity: 20,
          avgPrice: 186.2,
          currentPrice: 191.35,
          pnl: 103,
          pnlPercent: 2.77,
        },
      ]
    })
  }

  async getOrders(): Promise<BrokerOrder[]> {
    return this.authenticatedRequest(async () => {
      await wait(8)
      return [
        {
          orderId: 'kis-us-ord-001',
          symbol: 'AAPL',
          side: 'BUY',
          quantity: 2,
          price: 191.35,
          type: 'LIMIT',
          status: 'SUBMITTED',
          filledQuantity: 0,
          filledPrice: 0,
          createdAt: new Date('2026-03-25T00:00:00.000Z'),
        },
      ]
    })
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    return this.authenticatedRequest(async () => {
      if (!this.isPaper && !isUsRegularSessionOpen(new Date())) {
        throw new Error('KIS overseas order rejected: US market is closed (KST 기준)')
      }

      if (this.shouldSimulateNetworkError(order.symbol)) {
        throw new NetworkSimulationError('KIS overseas order network failure')
      }

      await wait(12)
      return {
        orderId: this.nextOrderId('kis-us'),
        status: 'SUBMITTED',
        filledQuantity: order.type === 'MARKET' ? order.quantity : 0,
        filledPrice: order.price ?? 191.35,
      }
    })
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.authenticatedRequest(async () => {
      if (this.shouldSimulateNetworkError(orderId)) {
        throw new NetworkSimulationError('KIS overseas cancel network failure')
      }
      await wait(6)
    })
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    return this.authenticatedRequest(async () => {
      if (this.shouldSimulateNetworkError(symbol)) {
        throw new NetworkSimulationError('KIS overseas quote network failure')
      }

      await wait(6)
      return {
        symbol,
        price: symbol === 'TSLA' ? 176.5 : 191.35,
        change: 1.28,
        changePercent: 0.67,
        volume: 42_000_000,
        timestamp: new Date(),
      }
    })
  }
}

export function isUsRegularSessionOpen(date: Date): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  const parts = formatter.formatToParts(date)
  const weekday = parts.find((part) => part.type === 'weekday')?.value
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')

  if (!weekday || weekday === 'Sat' || weekday === 'Sun') {
    return false
  }

  const totalMinutes = hour * 60 + minute
  const openMinutes = 9 * 60 + 30
  const closeMinutes = 16 * 60

  return totalMinutes >= openMinutes && totalMinutes < closeMinutes
}

async function wait(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}
