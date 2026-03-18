import type { PerformanceMetrics, Trade } from '@alphix/shared'

type PerformanceInput = {
  trades: Trade[]
  initialCapital: number
  finalEquity: number
  equityCurve: number[]
  startDate: Date
  endDate: Date
}

export function calculatePerformance(input: PerformanceInput): PerformanceMetrics {
  const totalReturn = input.initialCapital === 0 ? 0 : (input.finalEquity - input.initialCapital) / input.initialCapital
  const cagr = calculateCagr(input.initialCapital, input.finalEquity, input.startDate, input.endDate)
  const maxDrawdown = calculateMaxDrawdown(input.equityCurve)
  const sharpeRatio = calculateSharpeRatio(input.equityCurve)
  const winRate = calculateWinRate(input.trades)
  const profitFactor = calculateProfitFactor(input.trades)

  return {
    totalReturn,
    cagr,
    maxDrawdown,
    sharpeRatio,
    winRate,
    profitFactor,
  }
}

export function calculateCagr(initialCapital: number, finalEquity: number, startDate: Date, endDate: Date): number {
  if (initialCapital <= 0 || finalEquity <= 0) return 0

  const years = Math.max((endDate.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000), 1 / 365)
  return (finalEquity / initialCapital) ** (1 / years) - 1
}

export function calculateMaxDrawdown(equityCurve: number[]): number {
  if (equityCurve.length === 0) return 0

  let peak = equityCurve[0]
  let maxDrawdown = 0

  for (const equity of equityCurve) {
    if (equity > peak) peak = equity
    const drawdown = peak === 0 ? 0 : (peak - equity) / peak
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  }

  return maxDrawdown
}

export function calculateSharpeRatio(equityCurve: number[]): number {
  if (equityCurve.length < 2) return 0

  const returns: number[] = []
  for (let index = 1; index < equityCurve.length; index += 1) {
    const prev = equityCurve[index - 1]
    const curr = equityCurve[index]
    if (prev <= 0) continue
    returns.push((curr - prev) / prev)
  }

  if (returns.length === 0) return 0

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length
  const variance = returns.reduce((sum, value) => {
    const diff = value - mean
    return sum + diff * diff
  }, 0) / returns.length

  const stdDev = Math.sqrt(variance)
  if (stdDev === 0) return 0

  return (mean / stdDev) * Math.sqrt(252)
}

export function calculateWinRate(trades: Trade[]): number {
  const closedTrades = trades.filter((trade) => trade.side === 'SELL')
  if (closedTrades.length === 0) return 0

  const wins = closedTrades.filter((trade) => trade.pnl > 0).length
  return wins / closedTrades.length
}

export function calculateProfitFactor(trades: Trade[]): number {
  const closedTrades = trades.filter((trade) => trade.side === 'SELL')
  if (closedTrades.length === 0) return 0

  const grossProfit = closedTrades.filter((trade) => trade.pnl > 0).reduce((sum, trade) => sum + trade.pnl, 0)
  const grossLoss = Math.abs(closedTrades.filter((trade) => trade.pnl < 0).reduce((sum, trade) => sum + trade.pnl, 0))

  if (grossLoss === 0) return grossProfit > 0 ? Number.POSITIVE_INFINITY : 0
  return grossProfit / grossLoss
}
