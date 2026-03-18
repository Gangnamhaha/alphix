import '../../bun-test'
import { AlpacaBrokerAdapter } from '../alpaca'

describe('AlpacaBrokerAdapter', () => {
  test('connect and disconnect lifecycle', async () => {
    const adapter = new AlpacaBrokerAdapter({ apiKey: 'alpaca-key', secretKey: 'alpaca-secret', isPaper: true })

    await adapter.connect()
    expect(adapter.baseUrl).toBe('https://paper-api.alpaca.markets')

    await adapter.disconnect()
    await expectRejected(adapter.getBalance())
  })

  test('returns balance and order response', async () => {
    const adapter = new AlpacaBrokerAdapter({ apiKey: 'alpaca-key', secretKey: 'alpaca-secret', isPaper: true })
    await adapter.connect()

    const balance = await adapter.getBalance()
    expect(balance.currency).toBe('USD')

    const order = await adapter.placeOrder({ symbol: 'SPY', side: 'BUY', quantity: 1, type: 'MARKET' })
    expect(order.status).toBe('SUBMITTED')
    expect(order.orderId.startsWith('alp-')).toBe(true)
  })

  test('invalid credentials and network error', async () => {
    const bad = new AlpacaBrokerAdapter({ apiKey: 'invalid', secretKey: 'invalid' })
    await expectRejected(bad.connect())

    const adapter = new AlpacaBrokerAdapter({ apiKey: 'alpaca-key', secretKey: 'alpaca-secret' })
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
