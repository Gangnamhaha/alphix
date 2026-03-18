import '../../bun-test'
import type { OHLCV } from '@alphix/shared'
import { AIAnalysisStrategy } from '../ai-analysis'
import { BollingerBandsStrategy } from '../bollinger'
import { GridTradingStrategy } from '../grid'
import { MACDStrategy } from '../macd'

describe('BollingerBandsStrategy', () => {
  test('lower band touch -> BUY', async () => {
    const strategy = new BollingerBandsStrategy(3, 1)
    const signal = await strategy.getSignal(toCandles([10, 10, 8]))
    expect(signal).toBe('BUY')
  })

  test('upper band touch -> SELL', async () => {
    const strategy = new BollingerBandsStrategy(3, 1)
    const signal = await strategy.getSignal(toCandles([10, 10, 12]))
    expect(signal).toBe('SELL')
  })
})

describe('MACDStrategy', () => {
  test('MACD above signal -> BUY', async () => {
    const strategy = new MACDStrategy(2, 3, 2)
    const signal = await strategy.getSignal(toCandles([1, 2, 1, 3, 5]))
    expect(signal).toBe('BUY')
  })

  test('MACD below signal -> SELL', async () => {
    const strategy = new MACDStrategy(2, 3, 2)
    const signal = await strategy.getSignal(toCandles([5, 4, 5, 3, 1]))
    expect(signal).toBe('SELL')
  })
})

describe('GridTradingStrategy', () => {
  test('below nearest grid level -> BUY', async () => {
    const strategy = new GridTradingStrategy(90, 110, 4)
    const signal = await strategy.getSignal(toCandles([94]))
    expect(signal).toBe('BUY')
  })

  test('above nearest grid level -> SELL', async () => {
    const strategy = new GridTradingStrategy(90, 110, 4)
    const signal = await strategy.getSignal(toCandles([106]))
    expect(signal).toBe('SELL')
  })
})

describe('AIAnalysisStrategy', () => {
  test('uptrend returns BUY signal', async () => {
    const strategy = new AIAnalysisStrategy('gpt-signal-v1', 0.5)
    const signal = await strategy.getSignal(toCandles([100, 102, 104]))
    expect(signal).toBe('BUY')
  })

  test('request failure falls back to HOLD', async () => {
    class FailingAI extends AIAnalysisStrategy {
      protected override async requestAnalysis(): Promise<string> {
        throw new Error('simulated error')
      }
    }

    const strategy = new FailingAI('gpt-signal-v1', 0.5)
    const signal = await strategy.getSignal(toCandles([100, 99, 98]))
    expect(signal).toBe('HOLD')
  })
})

function toCandles(closes: number[]): OHLCV[] {
  return closes.map((close, index) => ({
    date: new Date(Date.UTC(2024, 0, index + 1)),
    open: close,
    high: close,
    low: close,
    close,
    volume: 100,
  }))
}
