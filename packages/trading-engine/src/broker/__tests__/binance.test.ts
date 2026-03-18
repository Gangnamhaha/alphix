import '../../bun-test'
import { BinanceBrokerAdapter } from '../binance'

describe('BinanceBrokerAdapter', () => {
  test('connect and disconnect lifecycle', async () => {
    const adapter = new BinanceBrokerAdapter({ apiKey: 'bin-key', secretKey: 'bin-secret', isPaper: true })

    await adapter.connect()
    expect(adapter.baseUrl).toBe('https://testnet.binance.vision')

    await adapter.disconnect()
    await expectRejected(adapter.getBalance())
  })

  test('returns balance and normalized order response', async () => {
    const adapter = new BinanceBrokerAdapter({ apiKey: 'bin-key', secretKey: 'bin-secret', stepSize: 0.001, tickSize: 0.1 })
    await adapter.connect()

    const balance = await adapter.getBalance()
    expect(balance.currency).toBe('USDT')

    const order = await adapter.placeOrder({ symbol: 'BTCUSDT', side: 'BUY', quantity: 0.00276, type: 'LIMIT', price: 67180.49 })
    expect(order.status).toBe('SUBMITTED')
    expect(order.filledPrice).toBe(67180.4)
  })

  test('invalid credentials and network error', async () => {
    const bad = new BinanceBrokerAdapter({ apiKey: 'invalid', secretKey: 'invalid' })
    await expectRejected(bad.connect())

    const adapter = new BinanceBrokerAdapter({ apiKey: 'bin-key', secretKey: 'bin-secret' })
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
