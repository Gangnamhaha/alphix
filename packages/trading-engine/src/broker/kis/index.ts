import type { Balance, MarketData, OrderRequest, OrderResponse, Position } from '@alphix/shared'
import { BaseKisBrokerAdapter, NetworkSimulationError } from './base'

export class KisBrokerAdapter extends BaseKisBrokerAdapter {
  constructor(config: { apiKey: string; secretKey: string; isPaper?: boolean }) {
    super(config)
  }

  async getBalance(): Promise<Balance> {
    return this.authenticatedRequest(async () => {
      await pause(8)
      return {
        total: 25_000_000,
        available: 10_500_000,
        currency: 'KRW',
      }
    })
  }

  async getPositions(): Promise<Position[]> {
    return this.authenticatedRequest(async () => {
      await pause(8)
      return [
        {
          symbol: '005930',
          quantity: 12,
          avgPrice: 73_000,
          currentPrice: 75_100,
          pnl: 25_200,
          pnlPercent: 2.88,
        },
      ]
    })
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    return this.authenticatedRequest(async () => {
      if (this.shouldSimulateNetworkError(order.symbol)) {
        throw new NetworkSimulationError('KIS domestic order network failure')
      }

      const referencePrice = order.price ?? 74_500
      await pause(12)

      return {
        orderId: this.nextOrderId('kis-kr'),
        status: 'SUBMITTED',
        filledQuantity: order.type === 'MARKET' ? order.quantity : 0,
        filledPrice: referencePrice,
      }
    })
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.authenticatedRequest(async () => {
      if (this.shouldSimulateNetworkError(orderId)) {
        throw new NetworkSimulationError('KIS domestic cancel network failure')
      }
      await pause(6)
    })
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    return this.authenticatedRequest(async () => {
      if (this.shouldSimulateNetworkError(symbol)) {
        throw new NetworkSimulationError('KIS domestic quote network failure')
      }

      const price = symbol === '000660' ? 185_700 : 75_100
      await pause(6)

      return {
        symbol,
        price,
        change: 1_100,
        changePercent: 1.49,
        volume: 5_800_000,
        timestamp: new Date(),
      }
    })
  }
}

async function pause(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}
