export function calculateSMA(data: number[], period: number): number[] {
  if (period <= 0 || data.length < period) return []

  const result: number[] = []
  let windowSum = 0

  for (let index = 0; index < data.length; index += 1) {
    windowSum += data[index]

    if (index >= period) {
      windowSum -= data[index - period]
    }

    if (index >= period - 1) {
      result.push(windowSum / period)
    }
  }

  return result
}

export function calculateEMA(data: number[], period: number): number[] {
  if (period <= 0 || data.length < period) return []

  const smoothing = 2 / (period + 1)
  const seed = calculateSMA(data.slice(0, period), period)[0]
  const result: number[] = [seed]
  let previousEma = seed

  for (let index = period; index < data.length; index += 1) {
    const ema = data[index] * smoothing + previousEma * (1 - smoothing)
    result.push(ema)
    previousEma = ema
  }

  return result
}

export function calculateRSI(data: number[], period: number): number[] {
  if (period <= 0 || data.length <= period) return []

  const changes: number[] = []
  for (let index = 1; index < data.length; index += 1) {
    changes.push(data[index] - data[index - 1])
  }

  let gains = 0
  let losses = 0

  for (let index = 0; index < period; index += 1) {
    const change = changes[index]
    if (change > 0) gains += change
    if (change < 0) losses += Math.abs(change)
  }

  let averageGain = gains / period
  let averageLoss = losses / period
  const result: number[] = [toRsi(averageGain, averageLoss)]

  for (let index = period; index < changes.length; index += 1) {
    const change = changes[index]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0

    averageGain = (averageGain * (period - 1) + gain) / period
    averageLoss = (averageLoss * (period - 1) + loss) / period
    result.push(toRsi(averageGain, averageLoss))
  }

  return result
}

export function calculateBollingerBands(
  data: number[],
  period: number,
  stdDev: number
): { upper: number[]; middle: number[]; lower: number[] } {
  if (period <= 0 || stdDev < 0 || data.length < period) {
    return { upper: [], middle: [], lower: [] }
  }

  const middle = calculateSMA(data, period)
  const upper: number[] = []
  const lower: number[] = []

  for (let index = period - 1; index < data.length; index += 1) {
    const window = data.slice(index - period + 1, index + 1)
    const mean = middle[index - period + 1]
    const variance = window.reduce((total, value) => {
      const diff = value - mean
      return total + diff * diff
    }, 0) / period

    const deviation = Math.sqrt(variance)
    upper.push(mean + stdDev * deviation)
    lower.push(mean - stdDev * deviation)
  }

  return { upper, middle, lower }
}

export function calculateMACD(
  data: number[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
): { macd: number[]; signal: number[]; histogram: number[] } {
  if (fastPeriod <= 0 || slowPeriod <= 0 || signalPeriod <= 0 || fastPeriod >= slowPeriod) {
    return { macd: [], signal: [], histogram: [] }
  }

  const fast = calculateEMA(data, fastPeriod)
  const slow = calculateEMA(data, slowPeriod)

  if (fast.length === 0 || slow.length === 0 || fast.length < slow.length) {
    return { macd: [], signal: [], histogram: [] }
  }

  const alignedFast = fast.slice(fast.length - slow.length)
  const macdLine = alignedFast.map((value, index) => value - slow[index])
  const signalLine = calculateEMA(macdLine, signalPeriod)

  if (signalLine.length === 0 || macdLine.length < signalLine.length) {
    return { macd: [], signal: [], histogram: [] }
  }

  const alignedMacd = macdLine.slice(macdLine.length - signalLine.length)
  const histogram = alignedMacd.map((value, index) => value - signalLine[index])

  return {
    macd: alignedMacd,
    signal: signalLine,
    histogram,
  }
}

function toRsi(averageGain: number, averageLoss: number): number {
  if (averageGain === 0 && averageLoss === 0) return 50
  if (averageLoss === 0) return 100
  if (averageGain === 0) return 0

  const relativeStrength = averageGain / averageLoss
  return 100 - 100 / (1 + relativeStrength)
}
