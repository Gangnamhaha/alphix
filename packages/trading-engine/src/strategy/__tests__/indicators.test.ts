import '../../bun-test'
import { calculateBollingerBands, calculateEMA, calculateMACD, calculateRSI, calculateSMA } from '../indicators'

describe('calculateSMA', () => {
  test('5-period SMA of [1,2,3,4,5] = [3]', () => {
    expect(calculateSMA([1, 2, 3, 4, 5], 5)).toEqual([3])
  })

  test('insufficient data returns empty', () => {
    expect(calculateSMA([1, 2, 3], 5)).toEqual([])
  })
})

describe('calculateEMA', () => {
  test('3-period EMA of [1,2,3,4,5] = [2,3,4]', () => {
    expect(calculateEMA([1, 2, 3, 4, 5], 3)).toEqual([2, 3, 4])
  })
})

describe('calculateRSI', () => {
  test('balanced move returns RSI 50', () => {
    const values = calculateRSI([1, 2, 1], 2)
    expect(values.length).toBe(1)
    expect(values[0]).toBe(50)
  })
})

describe('calculateBollingerBands', () => {
  test('known 5-point window returns expected band values', () => {
    const result = calculateBollingerBands([1, 2, 3, 4, 5], 5, 2)
    expect(result.middle).toEqual([3])
    expect(result.upper[0]).toBeCloseTo(5.82842712, 6)
    expect(result.lower[0]).toBeCloseTo(0.17157288, 6)
  })
})

describe('calculateMACD', () => {
  test('histogram always equals macd - signal', () => {
    const result = calculateMACD([1, 2, 3, 4, 5, 6, 7, 8, 9], 3, 6, 3)
    expect(result.macd.length).toBe(result.signal.length)
    expect(result.histogram.length).toBe(result.signal.length)

    result.histogram.forEach((value, index) => {
      expect(value).toBeCloseTo(result.macd[index] - result.signal[index], 10)
    })
  })
})
