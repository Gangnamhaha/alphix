import type { OrderRequest, OrderResponse, OrderStatus } from '@alphix/shared'
import { OrderValidator, type OrderValidationContext } from './order-validator'

type ExecuteOrder = (order: OrderRequest) => Promise<OrderResponse>

export type ManagedOrder = {
  orderId: string
  idempotencyKey: string
  request: OrderRequest
  status: OrderStatus
  filledQuantity: number
  filledPrice: number
  rejectionReason?: string
  createdAt: Date
  updatedAt: Date
}

type OrderManagerOptions = {
  validator?: OrderValidator
  executeOrder?: ExecuteOrder
}

const DEFAULT_EXECUTE_ORDER: ExecuteOrder = async (order) => {
  const price = typeof order.price === 'number' ? order.price : 0
  return {
    orderId: `ord-${Date.now()}`,
    status: 'FILLED',
    filledQuantity: order.quantity,
    filledPrice: price,
  }
}

export class OrderManager {
  private readonly orders = new Map<string, ManagedOrder>()
  private readonly idempotencyMap = new Map<string, string>()
  private readonly validator: OrderValidator
  private readonly executeOrder: ExecuteOrder
  private sequence = 0

  constructor(options: OrderManagerOptions = {}) {
    this.validator = options.validator ?? new OrderValidator()
    this.executeOrder = options.executeOrder ?? DEFAULT_EXECUTE_ORDER
  }

  async createOrder(
    request: OrderRequest,
    idempotencyKey: string,
    context: OrderValidationContext
  ): Promise<ManagedOrder> {
    const existingOrderId = this.idempotencyMap.get(idempotencyKey)
    if (existingOrderId) {
      const existingOrder = this.orders.get(existingOrderId)
      if (!existingOrder) {
        throw new Error(`Inconsistent order state for key ${idempotencyKey}`)
      }
      return existingOrder
    }

    const orderId = this.nextOrderId()
    const now = new Date()
    const managedOrder: ManagedOrder = {
      orderId,
      idempotencyKey,
      request,
      status: 'PENDING',
      filledQuantity: 0,
      filledPrice: 0,
      createdAt: now,
      updatedAt: now,
    }

    this.orders.set(orderId, managedOrder)
    this.idempotencyMap.set(idempotencyKey, orderId)

    const validation = this.validator.validate(request, context)
    if (!validation.valid) {
      this.updateOrder(orderId, {
        status: 'REJECTED',
        rejectionReason: validation.reason ?? 'Order validation failed',
      })
      return this.requireOrder(orderId)
    }

    this.updateOrder(orderId, { status: 'SUBMITTED' })

    try {
      const response = await this.executeOrder(request)
      this.updateOrder(orderId, {
        status: response.status,
        filledQuantity: response.filledQuantity,
        filledPrice: response.filledPrice,
      })
      return this.requireOrder(orderId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Order execution failed'
      this.updateOrder(orderId, { status: 'REJECTED', rejectionReason: message })
      return this.requireOrder(orderId)
    }
  }

  cancelOrder(orderId: string): ManagedOrder {
    const order = this.requireOrder(orderId)
    if (order.status === 'FILLED' || order.status === 'CANCELLED') {
      return order
    }

    this.updateOrder(orderId, { status: 'CANCELLED' })
    return this.requireOrder(orderId)
  }

  getOrder(orderId: string): ManagedOrder | undefined {
    return this.orders.get(orderId)
  }

  getOrders(): ManagedOrder[] {
    return [...this.orders.values()]
  }

  private updateOrder(orderId: string, patch: Partial<ManagedOrder>): void {
    const previous = this.requireOrder(orderId)
    this.orders.set(orderId, {
      ...previous,
      ...patch,
      updatedAt: new Date(),
    })
  }

  private requireOrder(orderId: string): ManagedOrder {
    const order = this.orders.get(orderId)
    if (!order) {
      throw new Error(`Order not found: ${orderId}`)
    }

    return order
  }

  private nextOrderId(): string {
    this.sequence += 1
    return `ord-${this.sequence.toString().padStart(6, '0')}`
  }
}
