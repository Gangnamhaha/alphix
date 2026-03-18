import type { OrderRequest, OrderResponse, Position } from '@alphix/shared'

type PaperEngineConfig = {
  initialBalance: number
  feeRate: number
  slippageRate: number
  startedAt?: Date
}

type PaperOrderInput = {
  order: OrderRequest
  marketPrice: number
}

type PaperOrderResult = {
  response: OrderResponse
  fee: number
  slippage: number
}

const MIN_PAPER_TRADING_DAYS = 30

export class PaperTradingEngine {
  private cashBalance: number
  private readonly positions = new Map<string, { quantity: number; avgPrice: number }>()
  private orderSeq = 0
  private readonly startedAt: Date

  constructor(private readonly config: PaperEngineConfig) {
    this.cashBalance = config.initialBalance
    this.startedAt = config.startedAt ?? new Date()
  }

  getBalance(): number {
    return this.cashBalance
  }

  getPositions(currentPriceBySymbol: Record<string, number> = {}): Position[] {
    return [...this.positions.entries()].map(([symbol, position]) => {
      const currentPrice = currentPriceBySymbol[symbol] ?? position.avgPrice
      const pnl = (currentPrice - position.avgPrice) * position.quantity
      const cost = position.avgPrice * position.quantity
      const pnlPercent = cost === 0 ? 0 : (pnl / cost) * 100

      return {
        symbol,
        quantity: position.quantity,
        avgPrice: position.avgPrice,
        currentPrice,
        pnl,
        pnlPercent,
      }
    })
  }

  placeOrder(input: PaperOrderInput): PaperOrderResult {
    const orderId = this.nextOrderId()

    if (input.order.quantity <= 0 || input.marketPrice <= 0) {
      return {
        response: {
          orderId,
          status: 'REJECTED',
          filledQuantity: 0,
          filledPrice: 0,
        },
        fee: 0,
        slippage: 0,
      }
    }

    if (input.order.type === 'LIMIT' && typeof input.order.price !== 'number') {
      return {
        response: {
          orderId,
          status: 'REJECTED',
          filledQuantity: 0,
          filledPrice: 0,
        },
        fee: 0,
        slippage: 0,
      }
    }

    const isFillableLimit =
      input.order.type === 'LIMIT'
        ? (input.order.side === 'BUY' && input.marketPrice <= (input.order.price as number)) ||
          (input.order.side === 'SELL' && input.marketPrice >= (input.order.price as number))
        : true

    if (!isFillableLimit) {
      return {
        response: {
          orderId,
          status: 'PENDING',
          filledQuantity: 0,
          filledPrice: 0,
        },
        fee: 0,
        slippage: 0,
      }
    }

    const sign = input.order.side === 'BUY' ? 1 : -1
    const executedPrice = input.marketPrice * (1 + sign * this.config.slippageRate)
    const notional = executedPrice * input.order.quantity
    const fee = notional * this.config.feeRate

    if (input.order.side === 'BUY' && this.cashBalance < notional + fee) {
      return {
        response: {
          orderId,
          status: 'REJECTED',
          filledQuantity: 0,
          filledPrice: 0,
        },
        fee: 0,
        slippage: 0,
      }
    }

    if (input.order.side === 'SELL') {
      const current = this.positions.get(input.order.symbol)
      if (!current || current.quantity < input.order.quantity) {
        return {
          response: {
            orderId,
            status: 'REJECTED',
            filledQuantity: 0,
            filledPrice: 0,
          },
          fee: 0,
          slippage: 0,
        }
      }
    }

    this.applyFill(input.order, executedPrice, fee)

    return {
      response: {
        orderId,
        status: 'FILLED',
        filledQuantity: input.order.quantity,
        filledPrice: executedPrice,
      },
      fee,
      slippage: Math.abs(executedPrice - input.marketPrice),
    }
  }

  getPaperTradingStatus(now: Date = new Date()): { eligible: boolean; daysRemaining: number } {
    const elapsedDays = Math.floor((now.getTime() - this.startedAt.getTime()) / (24 * 60 * 60 * 1000))
    const daysRemaining = Math.max(0, MIN_PAPER_TRADING_DAYS - elapsedDays)

    return {
      eligible: daysRemaining === 0,
      daysRemaining,
    }
  }

  private applyFill(order: OrderRequest, executedPrice: number, fee: number): void {
    const notional = executedPrice * order.quantity
    const position = this.positions.get(order.symbol)

    if (order.side === 'BUY') {
      this.cashBalance -= notional + fee

      if (!position) {
        this.positions.set(order.symbol, {
          quantity: order.quantity,
          avgPrice: executedPrice,
        })
        return
      }

      const nextQuantity = position.quantity + order.quantity
      const nextAvgPrice = (position.quantity * position.avgPrice + notional) / nextQuantity

      this.positions.set(order.symbol, {
        quantity: nextQuantity,
        avgPrice: nextAvgPrice,
      })
      return
    }

    this.cashBalance += notional - fee
    if (!position) return

    const nextQuantity = position.quantity - order.quantity
    if (nextQuantity <= 0) {
      this.positions.delete(order.symbol)
      return
    }

    this.positions.set(order.symbol, {
      quantity: nextQuantity,
      avgPrice: position.avgPrice,
    })
  }

  private nextOrderId(): string {
    this.orderSeq += 1
    return `paper-${this.orderSeq.toString().padStart(6, '0')}`
  }
}
