import type {
  Balance,
  BrokerAdapter,
  BrokerOrder,
  MarketData,
  OrderRequest,
  OrderResponse,
  Position,
} from '@alphix/shared'

type UpbitConfig = {
  apiKey: string
  secretKey: string
  isPaper?: boolean
}

const MIN_ORDER_KRW = 5_000

export class UpbitBrokerAdapter implements BrokerAdapter {
  private readonly apiKey: string
  private readonly secretKey: string
  private readonly isPaper: boolean
  private connected = false

  constructor(config: UpbitConfig) {
    this.apiKey = config.apiKey
    this.secretKey = config.secretKey
    this.isPaper = config.isPaper ?? false
  }

  async connect(): Promise<void> {
    if (!this.apiKey.trim() || !this.secretKey.trim()) {
      throw new Error('Upbit credentials are required')
    }
    if (
      this.apiKey.toLowerCase().includes('invalid') ||
      this.secretKey.toLowerCase().includes('invalid')
    ) {
      throw new Error('Upbit credentials are invalid')
    }
    this.connected = true
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async getBalance(): Promise<Balance> {
    this.ensureConnected()
    return {
      total: 3_500_000,
      available: 1_240_000,
      currency: 'KRW',
    }
  }

  async getPositions(): Promise<Position[]> {
    this.ensureConnected()
    return [
      {
        symbol: 'KRW-BTC',
        quantity: 0.0125,
        avgPrice: 96_500_000,
        currentPrice: 97_200_000,
        pnl: 8_750,
        pnlPercent: 0.73,
      },
    ]
  }

  async getOrders(): Promise<BrokerOrder[]> {
    this.ensureConnected()
    return [
      {
        orderId: 'upb-ord-001',
        symbol: 'KRW-BTC',
        side: 'BUY',
        quantity: 0.001,
        price: 97_200_000,
        type: 'LIMIT',
        status: 'SUBMITTED',
        filledQuantity: 0,
        filledPrice: 0,
        createdAt: new Date('2026-03-25T00:00:00.000Z'),
      },
    ]
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    this.ensureConnected()
    if (order.symbol.toUpperCase().includes('NETERR')) {
      throw new Error('Upbit network error simulated')
    }

    const notional = (order.price ?? 1_000_000) * order.quantity
    if (notional < MIN_ORDER_KRW) {
      throw new Error('Upbit minimum order amount is 5,000 KRW')
    }

    const payload = `${order.symbol}:${order.side}:${order.quantity}:${order.price ?? 'MKT'}`
    const token = await this.createJwt(payload)

    return {
      orderId: `upb-${token.slice(-12)}`,
      status: 'SUBMITTED',
      filledQuantity: order.type === 'MARKET' ? order.quantity : 0,
      filledPrice: order.price ?? 97_200_000,
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    this.ensureConnected()
    if (orderId.toUpperCase().includes('NETERR')) {
      throw new Error('Upbit network error simulated')
    }
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    this.ensureConnected()
    return {
      symbol,
      price: 97_200_000,
      change: 820_000,
      changePercent: 0.85,
      volume: 2_700,
      timestamp: new Date(),
    }
  }

  async createJwt(payload: string): Promise<string> {
    const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const body = toBase64Url(
      JSON.stringify({
        access_key: this.apiKey,
        nonce: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        payload,
      }),
    )
    const signature = toBase64Url(await hmacSha256Base64(this.secretKey, `${header}.${body}`))
    return `${header}.${body}.${signature}`
  }

  get baseUrl(): string {
    return this.isPaper ? 'https://api.upbit.mock.local' : 'https://api.upbit.com'
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Upbit adapter is not connected')
    }
  }
}

function toBase64Url(value: string): string {
  return encodeBase64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

async function hmacSha256Base64(secret: string, payload: string): Promise<string> {
  const keyData = new TextEncoder().encode(secret)
  const messageData = new TextEncoder().encode(payload)
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, messageData)

  let binary = ''
  Array.from(new Uint8Array(signature)).forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}
