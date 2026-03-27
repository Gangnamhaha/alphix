import '../../bun-test'
import { KisOverseasBrokerAdapter } from '../kis-overseas'

describe('KisOverseasBrokerAdapter', () => {
  test('connect and disconnect lifecycle', async () => {
    const adapter = new KisOverseasBrokerAdapter({
      apiKey: 'kis-us-key',
      secretKey: 'kis-us-secret',
      isPaper: true,
    })

    await adapter.connect()
    const balance = await adapter.getBalance()
    expect(balance.currency).toBe('USD')

    await adapter.disconnect()
    await expectRejected(adapter.getBalance())
  })

  test('returns USD balance and order response', async () => {
    const adapter = new KisOverseasBrokerAdapter({
      apiKey: 'kis-us-key',
      secretKey: 'kis-us-secret',
      isPaper: true,
    })
    await adapter.connect()

    const balance = await adapter.getBalance()
    expect(balance.currency).toBe('USD')
    expect(typeof balance.available).toBe('number')

    const orders = await adapter.getOrders()
    expect(orders.length).toBe(1)
    expect(orders[0]?.symbol).toBe('AAPL')

    const order = await adapter.placeOrder({
      symbol: 'AAPL',
      side: 'BUY',
      quantity: 2,
      type: 'MARKET',
    })
    expect(order.status).toBe('SUBMITTED')
    expect(order.orderId.startsWith('kis-us-')).toBe(true)
  })

  test('invalid credentials and network error', async () => {
    const bad = new KisOverseasBrokerAdapter({ apiKey: 'invalid', secretKey: 'invalid' })
    await expectRejected(bad.connect())

    const adapter = new KisOverseasBrokerAdapter({
      apiKey: 'kis-us-key',
      secretKey: 'kis-us-secret',
      isPaper: true,
    })
    await adapter.connect()
    await expectRejected(
      adapter.placeOrder({ symbol: 'NETERR', side: 'BUY', quantity: 1, type: 'MARKET' }),
    )
  })
})

async function expectRejected(promise: Promise<unknown>): Promise<void> {
  let rejected = false
  try {
    await promise
  } catch {
    rejected = true
  }
  expect(rejected).toBe(true)
}
