import '../../bun-test'
import type { MarketData } from '@alphix/shared'
import { DataFeedManager } from '../data-feed'
import { WebSocketManager, type WebSocketLike } from '../websocket-manager'

describe('WebSocketManager', () => {
  test('emits parsed data from connection', async () => {
    const factory = new FakeSocketFactory()
    const manager = new WebSocketManager((url) => factory.create(url), {
      heartbeatIntervalMs: 1000,
      reconnectBaseDelayMs: 5,
      reconnectMaxDelayMs: 10,
    })

    let received: unknown
    manager.onData((payload) => {
      received = payload
    })

    manager.connect('conn-1', 'wss://mock-feed')
    const socket = factory.latest()
    socket.open()
    socket.message(JSON.stringify({ symbol: 'BTCUSDT', price: 100 }))

    await sleep(2)

    expect(received).toMatchObject({ symbol: 'BTCUSDT', price: 100 })
    manager.disconnectAll()
  })

  test('reconnects with exponential backoff', async () => {
    const factory = new FakeSocketFactory()
    const manager = new WebSocketManager((url) => factory.create(url), {
      heartbeatIntervalMs: 1000,
      reconnectBaseDelayMs: 5,
      reconnectMaxDelayMs: 100,
      maxReconnectAttempts: 3,
    })

    let reconnectAttempt = 0
    manager.onReconnect((_id, attempt) => {
      reconnectAttempt = attempt
    })

    manager.connect('conn-2', 'wss://mock-reconnect')
    const first = factory.latest()
    first.open()
    first.closeByServer()

    await sleep(8)
    expect(reconnectAttempt).toBe(1)
    expect(factory.createdCount()).toBe(2)

    manager.disconnectAll()
  })

  test('sends heartbeat ping while active', async () => {
    const factory = new FakeSocketFactory()
    const manager = new WebSocketManager((url) => factory.create(url), {
      heartbeatIntervalMs: 5,
      reconnectBaseDelayMs: 10,
      reconnectMaxDelayMs: 20,
    })

    manager.connect('conn-3', 'wss://mock-heartbeat')
    const socket = factory.latest()
    socket.open()

    await sleep(12)

    expect(socket.sentMessages.length > 0).toBe(true)
    expect(socket.sentMessages[0].includes('PING')).toBe(true)
    manager.disconnectAll()
  })

  test('emits error for invalid json payload', async () => {
    const factory = new FakeSocketFactory()
    const manager = new WebSocketManager((url) => factory.create(url), {
      heartbeatIntervalMs: 1000,
      reconnectBaseDelayMs: 5,
      reconnectMaxDelayMs: 10,
    })

    let errorMessage = ''
    manager.onError((error) => {
      errorMessage = error.message
    })

    manager.connect('conn-4', 'wss://mock-invalid')
    const socket = factory.latest()
    socket.open()
    socket.message('invalid-json')

    await sleep(2)

    expect(errorMessage.includes('Invalid message payload')).toBe(true)
    manager.disconnectAll()
  })
})

describe('DataFeedManager', () => {
  test('normalizes broker payload to MarketData', async () => {
    const factory = new FakeSocketFactory()
    const manager = new WebSocketManager((url) => factory.create(url), {
      heartbeatIntervalMs: 1000,
      reconnectBaseDelayMs: 5,
      reconnectMaxDelayMs: 10,
    })

    const feed = new DataFeedManager(manager)
    feed.registerParser('binance', parseMarketData)

    const channelId = feed.subscribe('binance', 'BTCUSDT')

    let normalized: MarketData | undefined
    feed.onMarketData((data) => {
      normalized = data
    })

    const socket = factory.latest()
    socket.open()
    socket.message(
      JSON.stringify({
        channelId,
        symbol: 'BTCUSDT',
        price: 101,
        change: 1,
        changePercent: 1,
        volume: 99,
      })
    )

    await sleep(2)

    expect(normalized?.symbol).toBe('BTCUSDT')
    expect(normalized?.price).toBe(101)

    feed.unsubscribe(channelId)
    manager.disconnectAll()
  })

  test('ignores payload for unknown channel', async () => {
    const factory = new FakeSocketFactory()
    const manager = new WebSocketManager((url) => factory.create(url), {
      heartbeatIntervalMs: 1000,
      reconnectBaseDelayMs: 5,
      reconnectMaxDelayMs: 10,
    })

    const feed = new DataFeedManager(manager)
    feed.registerParser('binance', parseMarketData)

    let called = false
    feed.onMarketData(() => {
      called = true
    })

    const channelId = feed.subscribe('binance', 'BTCUSDT')
    const socket = factory.latest()
    socket.open()
    socket.message(
      JSON.stringify({
        channelId: 'binance:UNKNOWN',
        symbol: 'BTCUSDT',
        price: 100,
        change: 0,
        changePercent: 0,
        volume: 10,
      })
    )

    await sleep(2)

    expect(called).toBe(false)
    feed.unsubscribe(channelId)
    manager.disconnectAll()
  })
})

function parseMarketData(payload: unknown): MarketData | null {
  if (typeof payload !== 'object' || payload === null) return null
  const source = payload as {
    symbol?: string
    price?: number
    change?: number
    changePercent?: number
    volume?: number
  }

  if (
    typeof source.symbol !== 'string' ||
    typeof source.price !== 'number' ||
    typeof source.change !== 'number' ||
    typeof source.changePercent !== 'number' ||
    typeof source.volume !== 'number'
  ) {
    return null
  }

  return {
    symbol: source.symbol,
    price: source.price,
    change: source.change,
    changePercent: source.changePercent,
    volume: source.volume,
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
  }
}

class FakeSocketFactory {
  private readonly sockets: FakeSocket[] = []

  create(url: string): WebSocketLike {
    const socket = new FakeSocket(url)
    this.sockets.push(socket)
    return socket
  }

  latest(): FakeSocket {
    return this.sockets[this.sockets.length - 1]
  }

  createdCount(): number {
    return this.sockets.length
  }
}

class FakeSocket implements WebSocketLike {
  onopen?: () => void
  onmessage?: (event: { data: string }) => void
  onerror?: (error: Error) => void
  onclose?: () => void
  readonly sentMessages: string[] = []

  constructor(public readonly url: string) {}

  close(): void {
    this.onclose?.()
  }

  send(data: string): void {
    this.sentMessages.push(data)
  }

  open(): void {
    this.onopen?.()
  }

  message(payload: string): void {
    this.onmessage?.({ data: payload })
  }

  closeByServer(): void {
    this.onclose?.()
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}
