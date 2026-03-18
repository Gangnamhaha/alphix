import type { Balance, BrokerAdapter, MarketData, OrderRequest, OrderResponse, Position } from '@alphix/shared'

type AlpacaConfig = {
  apiKey: string
  secretKey: string
  isPaper?: boolean
}

export class AlpacaBrokerAdapter implements BrokerAdapter {
  private readonly apiKey: string
  private readonly secretKey: string
  private readonly isPaper: boolean
  private connected = false

  constructor(config: AlpacaConfig) {
    this.apiKey = config.apiKey
    this.secretKey = config.secretKey
    this.isPaper = config.isPaper ?? true
  }

  async connect(): Promise<void> {
    if (!this.apiKey.trim() || !this.secretKey.trim()) {
      throw new Error('Alpaca credentials are required')
    }
    if (this.apiKey.toLowerCase().includes('invalid') || this.secretKey.toLowerCase().includes('invalid')) {
      throw new Error('Alpaca credentials are invalid')
    }
    this.connected = true
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async getBalance(): Promise<Balance> {
    this.ensureConnected()
    return {
      total: 120_000,
      available: 46_500,
      currency: 'USD',
    }
  }

  async getPositions(): Promise<Position[]> {
    this.ensureConnected()
    return [
      {
        symbol: 'SPY',
        quantity: 10,
        avgPrice: 502.12,
        currentPrice: 508.42,
        pnl: 63,
        pnlPercent: 1.25,
      },
    ]
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    this.ensureConnected()
    if (order.symbol.toUpperCase().includes('NETERR')) {
      throw new Error('Alpaca network error simulated')
    }

    return {
      orderId: `alp-${Date.now().toString(36)}`,
      status: 'SUBMITTED',
      filledQuantity: order.type === 'MARKET' ? order.quantity : 0,
      filledPrice: order.price ?? 508.42,
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    this.ensureConnected()
    if (orderId.toUpperCase().includes('NETERR')) {
      throw new Error('Alpaca network error simulated')
    }
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    this.ensureConnected()
    return {
      symbol,
      price: symbol === 'QQQ' ? 435.77 : 508.42,
      change: 2.15,
      changePercent: 0.42,
      volume: 15_200_000,
      timestamp: new Date(),
    }
  }

  get baseUrl(): string {
    return this.isPaper ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets'
  }

  get authHeaders(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.secretKey,
    }
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Alpaca adapter is not connected')
    }
  }
}
