import { EventEmitter } from 'node:events'
import type { BrokerType, MarketData } from '@alphix/shared'
import { WebSocketManager } from './websocket-manager'

type DataFeedParser = (payload: unknown) => MarketData | null

type MarketDataHandler = (data: MarketData) => void

type Subscription = {
  broker: BrokerType
  symbol: string
  channelId: string
}

const BROKER_ENDPOINTS: Record<BrokerType, string> = {
  kis: 'wss://mock.kis.local/realtime',
  'kis-overseas': 'wss://mock.kis-overseas.local/realtime',
  alpaca: 'wss://mock.alpaca.local/realtime',
  kiwoom: 'wss://mock.kiwoom.local/realtime',
  binance: 'wss://mock.binance.local/realtime',
  upbit: 'wss://mock.upbit.local/realtime',
}

export class DataFeedManager extends EventEmitter {
  private readonly subscriptions = new Map<string, Subscription>()
  private readonly parsers = new Map<BrokerType, DataFeedParser>()

  constructor(private readonly websocketManager: WebSocketManager) {
    super()

    this.websocketManager.onData((payload) => {
      const normalized = this.normalizePayload(payload)
      if (normalized) {
        this.emit('marketData', normalized)
      }
    })
  }

  onMarketData(listener: MarketDataHandler): () => void {
    this.on('marketData', listener)
    return () => this.off('marketData', listener)
  }

  registerParser(broker: BrokerType, parser: DataFeedParser): void {
    this.parsers.set(broker, parser)
  }

  subscribe(broker: BrokerType, symbol: string): string {
    const channelId = `${broker}:${symbol}`
    if (this.subscriptions.has(channelId)) return channelId

    this.websocketManager.connect(channelId, `${BROKER_ENDPOINTS[broker]}?symbol=${encodeURIComponent(symbol)}`)
    this.subscriptions.set(channelId, { broker, symbol, channelId })

    return channelId
  }

  unsubscribe(channelId: string): void {
    if (!this.subscriptions.has(channelId)) return

    this.websocketManager.disconnect(channelId)
    this.subscriptions.delete(channelId)
  }

  unsubscribeAll(): void {
    for (const id of this.subscriptions.keys()) {
      this.unsubscribe(id)
    }
  }

  getActiveSubscriptions(): Subscription[] {
    return [...this.subscriptions.values()]
  }

  private normalizePayload(payload: unknown): MarketData | null {
    if (typeof payload !== 'object' || payload === null) {
      return null
    }

    const envelope = payload as { channelId?: string }
    if (!envelope.channelId || !this.subscriptions.has(envelope.channelId)) {
      return null
    }

    const subscription = this.subscriptions.get(envelope.channelId)
    if (!subscription) return null

    const parser = this.parsers.get(subscription.broker)
    if (!parser) return null

    return parser(payload)
  }
}
