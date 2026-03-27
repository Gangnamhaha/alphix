import type {
  Balance,
  BrokerAdapter,
  BrokerOrder,
  MarketData,
  OrderRequest,
  OrderResponse,
  Position,
} from '@alphix/shared'

type KisConfig = {
  apiKey: string
  secretKey: string
  isPaper?: boolean
}

type OAuthToken = {
  value: string
  expiresAt: number
}

export class NetworkSimulationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkSimulationError'
  }
}

const MAX_RETRY = 3
const RETRY_BASE_MS = 40
const TOKEN_TTL_MS = 5 * 60 * 1000
const RATE_LIMIT_PER_SECOND = 20

export abstract class BaseKisBrokerAdapter implements BrokerAdapter {
  protected readonly apiKey: string
  protected readonly secretKey: string
  protected readonly isPaper: boolean

  private token: OAuthToken | null = null
  private connected = false
  private requestWindow: number[] = []

  protected constructor(config: KisConfig) {
    this.apiKey = config.apiKey
    this.secretKey = config.secretKey
    this.isPaper = config.isPaper ?? false
  }

  async connect(): Promise<void> {
    this.ensureValidCredentials()
    this.token = await this.issueToken()
    this.connected = true
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.token = null
    this.requestWindow = []
  }

  abstract getBalance(): Promise<Balance>
  abstract getPositions(): Promise<Position[]>
  abstract getOrders(): Promise<BrokerOrder[]>
  abstract placeOrder(order: OrderRequest): Promise<OrderResponse>
  abstract cancelOrder(orderId: string): Promise<void>
  abstract getMarketData(symbol: string): Promise<MarketData>

  protected get oauthToken(): string {
    if (!this.token) {
      throw new Error('KIS OAuth token is not available')
    }
    return this.token.value
  }

  protected async authenticatedRequest<T>(executor: () => Promise<T>): Promise<T> {
    this.ensureConnected()
    this.enforceRateLimit()
    await this.refreshTokenIfNeeded()

    let lastError: unknown
    for (let attempt = 0; attempt < MAX_RETRY; attempt += 1) {
      try {
        return await executor()
      } catch (error) {
        lastError = error
        const retryable = error instanceof NetworkSimulationError
        const shouldRetry = retryable && attempt < MAX_RETRY - 1
        if (!shouldRetry) {
          throw error
        }
        await delay(RETRY_BASE_MS * 2 ** attempt)
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Unknown KIS request error')
  }

  protected shouldSimulateNetworkError(seed: string): boolean {
    return (
      seed.toUpperCase().includes('NETERR') || this.apiKey.toLowerCase().includes('network-error')
    )
  }

  protected nextOrderId(prefix: string): string {
    const stamp = Date.now().toString(36)
    const random = Math.random().toString(36).slice(2, 8)
    return `${prefix}-${stamp}-${random}`
  }

  protected getBaseUrl(): string {
    return this.isPaper
      ? 'https://openapivts.koreainvestment.com:29443'
      : 'https://openapi.koreainvestment.com:9443'
  }

  private ensureValidCredentials(): void {
    if (!this.apiKey.trim() || !this.secretKey.trim()) {
      throw new Error('KIS credentials are required')
    }
    if (
      this.apiKey.toLowerCase().includes('invalid') ||
      this.secretKey.toLowerCase().includes('invalid')
    ) {
      throw new Error('KIS credentials are invalid')
    }
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('KIS adapter is not connected')
    }
  }

  private enforceRateLimit(): void {
    const now = Date.now()
    this.requestWindow = this.requestWindow.filter((timestamp) => now - timestamp < 1000)
    if (this.requestWindow.length >= RATE_LIMIT_PER_SECOND) {
      throw new Error('KIS rate limit exceeded: max 20req/sec')
    }
    this.requestWindow.push(now)
  }

  private async issueToken(): Promise<OAuthToken> {
    await delay(10)
    const token = `kis-oauth-${this.apiKey.slice(0, 4)}-${Date.now()}`
    return {
      value: token,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    }
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.token || this.token.expiresAt <= Date.now()) {
      this.token = await this.issueToken()
    }
  }
}

async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}
