import {
  createTradingOrdersGetHandler,
  createTradingOrdersPostHandler,
} from '@/lib/trading/orders-route'

export const POST = createTradingOrdersPostHandler()
export const GET = createTradingOrdersGetHandler()
