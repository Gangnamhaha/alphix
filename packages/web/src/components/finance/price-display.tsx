interface PriceDisplayProps {
  price: number
  change: number
  changePercent: number
  currency?: string
}

export function PriceDisplay({ price, change, changePercent, currency = 'KRW' }: PriceDisplayProps) {
  const isPositive = change >= 0
  const fmt = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 })

  return (
    <div>
      <span className="text-lg font-semibold">{fmt.format(price)}</span>
      <span className={`ml-2 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}{fmt.format(change)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
      </span>
    </div>
  )
}
