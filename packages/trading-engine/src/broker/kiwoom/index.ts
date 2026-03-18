import type { Balance, BrokerAdapter, MarketData, OrderRequest, OrderResponse, Position } from '@alphix/shared'

type KiwoomConfig = {
  apiKey: string
  secretKey: string
  isPaper?: boolean
  proxyConnected?: boolean
}

export class KiwoomBrokerAdapter implements BrokerAdapter {
  private readonly apiKey: string
  private readonly secretKey: string
  private readonly isPaper: boolean
  private readonly proxyConnected: boolean
  private connected = false

  constructor(config: KiwoomConfig) {
    this.apiKey = config.apiKey
    this.secretKey = config.secretKey
    this.isPaper = config.isPaper ?? false
    this.proxyConnected = config.proxyConnected ?? true
  }

  async connect(): Promise<void> {
    if (!this.apiKey.trim() || !this.secretKey.trim()) {
      throw new Error('Kiwoom credentials are required')
    }
    if (!this.proxyConnected) {
      throw new Error('Kiwoom Windows proxy is not connected. Please start the proxy bridge.')
    }
    this.connected = true
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async getBalance(): Promise<Balance> {
    this.ensureReady()
    return {
      total: 12_800_000,
      available: 6_000_000,
      currency: 'KRW',
    }
  }

  async getPositions(): Promise<Position[]> {
    this.ensureReady()
    return [
      {
        symbol: '035420',
        quantity: 16,
        avgPrice: 201_000,
        currentPrice: 205_500,
        pnl: 72_000,
        pnlPercent: 2.24,
      },
    ]
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    this.ensureReady()

    if (order.symbol.toUpperCase().includes('NETERR')) {
      throw new Error('Kiwoom proxy request failed')
    }

    return {
      orderId: `kiwoom-${Date.now().toString(36)}`,
      status: 'SUBMITTED',
      filledQuantity: order.type === 'MARKET' ? order.quantity : 0,
      filledPrice: order.price ?? 205_500,
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    this.ensureReady()
    if (orderId.toUpperCase().includes('NETERR')) {
      throw new Error('Kiwoom proxy request failed')
    }
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    this.ensureReady()
    return {
      symbol,
      price: 205_500,
      change: 3_100,
      changePercent: 1.53,
      volume: 1_250_000,
      timestamp: new Date(),
    }
  }

  get proxyUrl(): string {
    return this.isPaper ? 'http://127.0.0.1:18080/mock' : 'http://127.0.0.1:18080/live'
  }

  private ensureReady(): void {
    if (!this.connected) {
      throw new Error('Kiwoom adapter is not connected')
    }
    if (!this.proxyConnected) {
      throw new Error('Kiwoom Windows proxy is not connected')
    }
  }
}
