import type { Strategy, StrategyType } from '@alphix/shared'
import { AIAnalysisStrategy } from './ai-analysis'
import { BollingerBandsStrategy } from './bollinger'
import { GridTradingStrategy } from './grid'
import { MACDStrategy } from './macd'
import { MACrossoverStrategy } from './ma-crossover'
import { RSIStrategy } from './rsi'

export { MACrossoverStrategy } from './ma-crossover'
export { RSIStrategy } from './rsi'
export { BollingerBandsStrategy } from './bollinger'
export { MACDStrategy } from './macd'
export { GridTradingStrategy } from './grid'
export { AIAnalysisStrategy } from './ai-analysis'
export { calculateSMA, calculateEMA, calculateRSI, calculateBollingerBands, calculateMACD } from './indicators'

export function createStrategy(type: StrategyType, params: Record<string, number | string | boolean> = {}): Strategy {
  switch (type) {
    case 'ma-crossover':
      return new MACrossoverStrategy(readNumber(params.shortPeriod, 5), readNumber(params.longPeriod, 20))
    case 'rsi':
      return new RSIStrategy(readNumber(params.period, 14), readNumber(params.overbought, 70), readNumber(params.oversold, 30))
    case 'bollinger':
      return new BollingerBandsStrategy(readNumber(params.period, 20), readNumber(params.stdDev, 2))
    case 'macd':
      return new MACDStrategy(readNumber(params.fastPeriod, 12), readNumber(params.slowPeriod, 26), readNumber(params.signalPeriod, 9))
    case 'grid':
      return new GridTradingStrategy(readNumber(params.lowerBound, 90), readNumber(params.upperBound, 110), readNumber(params.gridCount, 10))
    case 'ai':
      return new AIAnalysisStrategy(readString(params.model, 'gpt-signal-v1'), readNumber(params.minConfidence, 0.65))
    default:
      return new MACrossoverStrategy()
  }
}

function readNumber(value: number | string | boolean | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readString(value: number | string | boolean | undefined, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}
