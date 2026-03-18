import type { StrategyType } from '../types/strategy'

export const STRATEGY_DEFAULT_PARAMS: Record<StrategyType, Record<string, number | string | boolean>> = {
  'ma-crossover': {
    shortPeriod: 20,
    longPeriod: 50,
  },
  rsi: {
    period: 14,
    overbought: 70,
    oversold: 30,
  },
  bollinger: {
    period: 20,
    stdDev: 2,
  },
  macd: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
  },
  grid: {
    gridCount: 10,
    spacingPercent: 1,
  },
  ai: {
    model: 'gpt-signal-v1',
    minConfidence: 0.65,
    paperOnly: true,
  },
}

export function hasStrategyDefaults(value: unknown): value is StrategyType {
  return typeof value === 'string' && value in STRATEGY_DEFAULT_PARAMS
}
