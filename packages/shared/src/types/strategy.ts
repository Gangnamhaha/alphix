import type { OHLCV } from './common'

export type StrategyType = 'ma-crossover' | 'rsi' | 'bollinger' | 'macd' | 'grid' | 'ai'
export type Signal = 'BUY' | 'SELL' | 'HOLD'

export interface Strategy {
  analyze(data: OHLCV[]): Promise<StrategyResult>
  getSignal(data: OHLCV[]): Promise<Signal>
  getRequiredDataPoints(): number
}

export interface StrategyConfig {
  type: StrategyType
  params: Record<string, number | string | boolean>
}

export interface StrategyResult {
  signal: Signal
  confidence: number
  reason: string
}

export function isStrategyType(value: unknown): value is StrategyType {
  return value === 'ma-crossover' || value === 'rsi' || value === 'bollinger' || value === 'macd' || value === 'grid' || value === 'ai'
}

export function isSignal(value: unknown): value is Signal {
  return value === 'BUY' || value === 'SELL' || value === 'HOLD'
}

export function isBuySignal(value: unknown): value is 'BUY' {
  return value === 'BUY'
}

export function isStrategyConfig(value: unknown): value is StrategyConfig {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<StrategyConfig>

  return isStrategyType(candidate.type) && typeof candidate.params === 'object' && candidate.params !== null && !Array.isArray(candidate.params)
}

export function isStrategyResult(value: unknown): value is StrategyResult {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<StrategyResult>

  return isSignal(candidate.signal) && typeof candidate.confidence === 'number' && typeof candidate.reason === 'string'
}
