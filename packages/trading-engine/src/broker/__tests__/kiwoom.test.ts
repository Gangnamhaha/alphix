import '../../bun-test'
import { KiwoomBrokerAdapter } from '../kiwoom'

describe('KiwoomBrokerAdapter', () => {
  test('connect and disconnect lifecycle', async () => {
    const adapter = new KiwoomBrokerAdapter({ apiKey: 'kiwoom-key', secretKey: 'kiwoom-secret', proxyConnected: true })

    await adapter.connect()
    const balance = await adapter.getBalance()
    expect(balance.currency).toBe('KRW')

    await adapter.disconnect()
    await expectRejected(adapter.getBalance())
  })

  test('returns balance and order response', async () => {
    const adapter = new KiwoomBrokerAdapter({ apiKey: 'kiwoom-key', secretKey: 'kiwoom-secret', proxyConnected: true })
    await adapter.connect()

    const balance = await adapter.getBalance()
    expect(balance.currency).toBe('KRW')

    const order = await adapter.placeOrder({ symbol: '035420', side: 'BUY', quantity: 1, type: 'LIMIT', price: 205_500 })
    expect(order.status).toBe('SUBMITTED')
    expect(order.orderId.startsWith('kiwoom-')).toBe(true)
  })

  test('graceful proxy error and network error', async () => {
    const noProxy = new KiwoomBrokerAdapter({ apiKey: 'kiwoom-key', secretKey: 'kiwoom-secret', proxyConnected: false })
    await expectRejected(noProxy.connect())

    const adapter = new KiwoomBrokerAdapter({ apiKey: 'kiwoom-key', secretKey: 'kiwoom-secret', proxyConnected: true })
    await adapter.connect()
    await expectRejected(adapter.placeOrder({ symbol: 'NETERR', side: 'BUY', quantity: 1, type: 'MARKET' }))
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
