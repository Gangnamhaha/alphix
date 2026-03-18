export type BrokerType = 'kis' | 'kis-overseas' | 'alpaca' | 'kiwoom' | 'binance' | 'upbit'
export type Market = 'KR' | 'US' | 'CRYPTO'

export interface BrokerConfig {
  id: number
  userId: number
  brokerType: BrokerType
  isActive: boolean
}

export interface BrokerAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  getBalance(): Promise<Balance>
  getPositions(): Promise<Position[]>
  placeOrder(order: OrderRequest): Promise<OrderResponse>
  cancelOrder(orderId: string): Promise<void>
  getMarketData(symbol: string): Promise<MarketData>
}

export interface OrderRequest {
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  price?: number
  type: 'MARKET' | 'LIMIT'
}

export interface OrderResponse {
  orderId: string
  status: OrderStatus
  filledQuantity: number
  filledPrice: number
}

export type OrderStatus = 'PENDING' | 'SUBMITTED' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED'

export interface Position {
  symbol: string
  quantity: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
}

export interface Balance {
  total: number
  available: number
  currency: string
}

export interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: Date
}

export function isBrokerType(value: unknown): value is BrokerType {
  return value === 'kis' || value === 'kis-overseas' || value === 'alpaca' || value === 'kiwoom' || value === 'binance' || value === 'upbit'
}

export function isMarket(value: unknown): value is Market {
  return value === 'KR' || value === 'US' || value === 'CRYPTO'
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    value === 'PENDING' ||
    value === 'SUBMITTED' ||
    value === 'FILLED' ||
    value === 'PARTIALLY_FILLED' ||
    value === 'CANCELLED' ||
    value === 'REJECTED'
  )
}

export function isValidOrder(value: unknown): value is OrderRequest {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<OrderRequest>

  return (
    typeof candidate.symbol === 'string' &&
    (candidate.side === 'BUY' || candidate.side === 'SELL') &&
    typeof candidate.quantity === 'number' &&
    (candidate.price === undefined || typeof candidate.price === 'number') &&
    (candidate.type === 'MARKET' || candidate.type === 'LIMIT')
  )
}

export function isBrokerConfig(value: unknown): value is BrokerConfig {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<BrokerConfig>

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.userId === 'number' &&
    isBrokerType(candidate.brokerType) &&
    typeof candidate.isActive === 'boolean'
  )
}
