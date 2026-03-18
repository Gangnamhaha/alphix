import type { StrategyType } from './strategy'

export interface BacktestConfig {
  strategyType: StrategyType
  symbol: string
  startDate: Date
  endDate: Date
  initialCapital: number
  commission: number
  slippage: number
}

export interface BacktestResult {
  totalReturn: number
  cagr: number
  maxDrawdown: number
  sharpeRatio: number
  winRate: number
  totalTrades: number
  trades: Trade[]
}

export interface Trade {
  date: Date
  side: 'BUY' | 'SELL'
  price: number
  quantity: number
  pnl: number
}

export interface PerformanceMetrics {
  totalReturn: number
  cagr: number
  maxDrawdown: number
  sharpeRatio: number
  winRate: number
  profitFactor: number
}

export function isTrade(value: unknown): value is Trade {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<Trade>

  return (
    candidate.date instanceof Date &&
    (candidate.side === 'BUY' || candidate.side === 'SELL') &&
    typeof candidate.price === 'number' &&
    typeof candidate.quantity === 'number' &&
    typeof candidate.pnl === 'number'
  )
}

export function isBacktestConfig(value: unknown): value is BacktestConfig {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<BacktestConfig>

  return (
    typeof candidate.strategyType === 'string' &&
    typeof candidate.symbol === 'string' &&
    candidate.startDate instanceof Date &&
    candidate.endDate instanceof Date &&
    typeof candidate.initialCapital === 'number' &&
    typeof candidate.commission === 'number' &&
    typeof candidate.slippage === 'number'
  )
}

export function isBacktestResult(value: unknown): value is BacktestResult {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<BacktestResult>

  return (
    typeof candidate.totalReturn === 'number' &&
    typeof candidate.cagr === 'number' &&
    typeof candidate.maxDrawdown === 'number' &&
    typeof candidate.sharpeRatio === 'number' &&
    typeof candidate.winRate === 'number' &&
    typeof candidate.totalTrades === 'number' &&
    Array.isArray(candidate.trades) &&
    candidate.trades.every((trade) => isTrade(trade))
  )
}
