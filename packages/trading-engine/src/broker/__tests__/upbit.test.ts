import '../../bun-test'
import { UpbitBrokerAdapter } from '../upbit'

describe('UpbitBrokerAdapter', () => {
  test('connect and disconnect lifecycle', async () => {
    const adapter = new UpbitBrokerAdapter({ apiKey: 'up-key', secretKey: 'up-secret' })

    await adapter.connect()
    const balance = await adapter.getBalance()
    expect(balance.currency).toBe('KRW')

    await adapter.disconnect()
    await expectRejected(adapter.getBalance())
  })

  test('returns balance and order response', async () => {
    const adapter = new UpbitBrokerAdapter({ apiKey: 'up-key', secretKey: 'up-secret' })
    await adapter.connect()

    const balance = await adapter.getBalance()
    expect(balance.currency).toBe('KRW')

    const order = await adapter.placeOrder({ symbol: 'KRW-BTC', side: 'BUY', quantity: 0.001, type: 'LIMIT', price: 97_200_000 })
    expect(order.status).toBe('SUBMITTED')
    expect(order.orderId.startsWith('upb-')).toBe(true)
  })

  test('invalid credentials and network/minimum amount errors', async () => {
    const bad = new UpbitBrokerAdapter({ apiKey: 'invalid', secretKey: 'invalid' })
    await expectRejected(bad.connect())

    const adapter = new UpbitBrokerAdapter({ apiKey: 'up-key', secretKey: 'up-secret' })
    await adapter.connect()

    await expectRejected(adapter.placeOrder({ symbol: 'NETERR', side: 'BUY', quantity: 1, type: 'MARKET' }))
    await expectRejected(adapter.placeOrder({ symbol: 'KRW-BTC', side: 'BUY', quantity: 0.0001, type: 'LIMIT', price: 10_000 }))
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
