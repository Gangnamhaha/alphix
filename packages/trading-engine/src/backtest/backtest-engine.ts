import type { BacktestResult, OHLCV, Strategy, Trade } from '@alphix/shared'
import { calculatePerformance } from './performance'

type BacktestEngineConfig = {
  initialCapital: number
  commission: number
  slippage: number
}

type Position = {
  quantity: number
  averagePrice: number
}

export class BacktestEngine {
  async run(strategy: Strategy, historicalData: OHLCV[], config: BacktestEngineConfig): Promise<BacktestResult> {
    if (historicalData.length === 0) {
      return {
        totalReturn: 0,
        cagr: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        winRate: 0,
        totalTrades: 0,
        trades: [],
      }
    }

    let cash = config.initialCapital
    let position: Position | undefined
    const trades: Trade[] = []
    const equityCurve: number[] = [cash]

    const required = strategy.getRequiredDataPoints()
    for (let index = 0; index < historicalData.length; index += 1) {
      const candle = historicalData[index]
      const window = historicalData.slice(0, index + 1)

      if (window.length >= required) {
        const signal = await strategy.getSignal(window)

        if (signal === 'BUY' && !position) {
          const executedPrice = candle.close * (1 + config.slippage)
          const quantity = cash / (executedPrice * (1 + config.commission))

          if (quantity > 0) {
            const notional = executedPrice * quantity
            const fee = notional * config.commission
            cash -= notional + fee
            position = { quantity, averagePrice: executedPrice }

            trades.push({
              date: candle.date,
              side: 'BUY',
              price: executedPrice,
              quantity,
              pnl: 0,
            })
          }
        }

        if (signal === 'SELL' && position) {
          const executedPrice = candle.close * (1 - config.slippage)
          const notional = executedPrice * position.quantity
          const fee = notional * config.commission
          const cost = position.averagePrice * position.quantity
          const pnl = notional - fee - cost

          cash += notional - fee

          trades.push({
            date: candle.date,
            side: 'SELL',
            price: executedPrice,
            quantity: position.quantity,
            pnl,
          })

          position = undefined
        }
      }

      const equity = position ? cash + position.quantity * candle.close : cash
      equityCurve.push(equity)
    }

    const lastClose = historicalData[historicalData.length - 1].close
    const finalEquity = position ? cash + position.quantity * lastClose : cash
    const performance = calculatePerformance({
      trades,
      initialCapital: config.initialCapital,
      finalEquity,
      equityCurve,
      startDate: historicalData[0].date,
      endDate: historicalData[historicalData.length - 1].date,
    })

    return {
      totalReturn: performance.totalReturn,
      cagr: performance.cagr,
      maxDrawdown: performance.maxDrawdown,
      sharpeRatio: performance.sharpeRatio,
      winRate: performance.winRate,
      totalTrades: trades.length,
      trades,
    }
  }
}
