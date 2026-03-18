export interface OHLCV {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'

export interface Pagination {
  page: number
  limit: number
  total: number
}

export function isTimeFrame(value: unknown): value is TimeFrame {
  return value === '1m' || value === '5m' || value === '15m' || value === '1h' || value === '4h' || value === '1d' || value === '1w'
}

export function isOHLCV(value: unknown): value is OHLCV {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<OHLCV>

  return (
    candidate.date instanceof Date &&
    typeof candidate.open === 'number' &&
    typeof candidate.high === 'number' &&
    typeof candidate.low === 'number' &&
    typeof candidate.close === 'number' &&
    typeof candidate.volume === 'number'
  )
}

export function isPagination(value: unknown): value is Pagination {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<Pagination>

  return typeof candidate.page === 'number' && typeof candidate.limit === 'number' && typeof candidate.total === 'number'
}
