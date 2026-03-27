import '../../bun-test'
import { KisBrokerAdapter } from '../kis'

describe('KisBrokerAdapter', () => {
  test('connect and disconnect lifecycle', async () => {
    const adapter = new KisBrokerAdapter({
      apiKey: 'kis-key',
      secretKey: 'kis-secret',
      isPaper: true,
    })

    await adapter.connect()
    const balance = await adapter.getBalance()
    expect(balance.currency).toBe('KRW')

    await adapter.disconnect()
    await expectRejected(adapter.getBalance())
  })

  test('returns balance and order response', async () => {
    const adapter = new KisBrokerAdapter({
      apiKey: 'kis-key',
      secretKey: 'kis-secret',
      isPaper: true,
    })
    await adapter.connect()

    const balance = await adapter.getBalance()
    expect(balance.currency).toBe('KRW')
    expect(typeof balance.total).toBe('number')

    const orders = await adapter.getOrders()
    expect(orders.length).toBe(1)
    expect(orders[0]?.symbol).toBe('005930')

    const order = await adapter.placeOrder({
      symbol: '005930',
      side: 'BUY',
      quantity: 1,
      type: 'MARKET',
    })
    expect(order.status).toBe('SUBMITTED')
    expect(order.orderId.startsWith('kis-kr-')).toBe(true)
  })

  test('invalid credentials and network error', async () => {
    const bad = new KisBrokerAdapter({ apiKey: 'invalid-key', secretKey: 'invalid-secret' })
    await expectRejected(bad.connect())

    const adapter = new KisBrokerAdapter({
      apiKey: 'kis-key',
      secretKey: 'kis-secret',
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
