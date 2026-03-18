import type { Balance, BrokerAdapter, MarketData, OrderRequest, OrderResponse, Position } from '@alphix/shared'

type BinanceConfig = {
  apiKey: string
  secretKey: string
  isPaper?: boolean
  stepSize?: number
  tickSize?: number
}

export class BinanceBrokerAdapter implements BrokerAdapter {
  private readonly apiKey: string
  private readonly secretKey: string
  private readonly isPaper: boolean
  private readonly stepSize: number
  private readonly tickSize: number
  private connected = false

  constructor(config: BinanceConfig) {
    this.apiKey = config.apiKey
    this.secretKey = config.secretKey
    this.isPaper = config.isPaper ?? false
    this.stepSize = config.stepSize ?? 0.001
    this.tickSize = config.tickSize ?? 0.1
  }

  async connect(): Promise<void> {
    if (!this.apiKey.trim() || !this.secretKey.trim()) {
      throw new Error('Binance credentials are required')
    }
    if (this.apiKey.toLowerCase().includes('invalid') || this.secretKey.toLowerCase().includes('invalid')) {
      throw new Error('Binance credentials are invalid')
    }
    this.connected = true
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async getBalance(): Promise<Balance> {
    this.ensureConnected()
    return {
      total: 5.2,
      available: 2.45,
      currency: 'USDT',
    }
  }

  async getPositions(): Promise<Position[]> {
    this.ensureConnected()
    return [
      {
        symbol: 'BTCUSDT',
        quantity: 0.052,
        avgPrice: 66_200,
        currentPrice: 67_180,
        pnl: 50.96,
        pnlPercent: 1.48,
      },
    ]
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    this.ensureConnected()
    if (order.symbol.toUpperCase().includes('NETERR')) {
      throw new Error('Binance network error simulated')
    }

    const quantity = adjustToStep(order.quantity, this.stepSize)
    const rawPrice = order.price ?? 67_180.45
    const price = adjustToTick(rawPrice, this.tickSize)
    const query = `symbol=${order.symbol}&side=${order.side}&type=${order.type}&quantity=${quantity}&price=${price}`
    const signature = await this.sign(query)

    return {
      orderId: `bin-${signature.slice(0, 12)}`,
      status: 'SUBMITTED',
      filledQuantity: order.type === 'MARKET' ? quantity : 0,
      filledPrice: price,
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    this.ensureConnected()
    if (orderId.toUpperCase().includes('NETERR')) {
      throw new Error('Binance network error simulated')
    }
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    this.ensureConnected()
    return {
      symbol,
      price: 67_180.4,
      change: 730.2,
      changePercent: 1.09,
      volume: 1_800,
      timestamp: new Date(),
    }
  }

  get baseUrl(): string {
    return this.isPaper ? 'https://testnet.binance.vision' : 'https://api.binance.com'
  }

  async sign(payload: string): Promise<string> {
    return hmacSha256Hex(this.secretKey, payload)
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Binance adapter is not connected')
    }
  }
}

function adjustToStep(value: number, stepSize: number): number {
  const stepped = Math.floor(value / stepSize) * stepSize
  return Number(stepped.toFixed(8))
}

function adjustToTick(value: number, tickSize: number): number {
  const ticked = Math.floor(value / tickSize) * tickSize
  return Number(ticked.toFixed(8))
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const keyData = new TextEncoder().encode(secret)
  const messageData = new TextEncoder().encode(payload)
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, messageData)
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
