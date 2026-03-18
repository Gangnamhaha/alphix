import type { BrokerType, Market } from '../types/broker'

export interface BrokerMarketHours {
  market: Market
  open: string
  close: string
  timezone: string
}

export interface BrokerDefinition {
  apiBaseUrl: string
  websocketUrl: string | null
  rateLimitPerMinute: number
  marketHours: BrokerMarketHours[]
}

export const BROKER_ENDPOINTS: Record<BrokerType, BrokerDefinition> = {
  kis: {
    apiBaseUrl: 'https://openapi.koreainvestment.com:9443',
    websocketUrl: 'ws://ops.koreainvestment.com:21000',
    rateLimitPerMinute: 120,
    marketHours: [{ market: 'KR', open: '09:00', close: '15:30', timezone: 'Asia/Seoul' }],
  },
  'kis-overseas': {
    apiBaseUrl: 'https://openapi.koreainvestment.com:9443',
    websocketUrl: 'ws://ops.koreainvestment.com:31000',
    rateLimitPerMinute: 120,
    marketHours: [{ market: 'US', open: '09:30', close: '16:00', timezone: 'America/New_York' }],
  },
  alpaca: {
    apiBaseUrl: 'https://paper-api.alpaca.markets',
    websocketUrl: 'wss://stream.data.alpaca.markets/v2/sip',
    rateLimitPerMinute: 200,
    marketHours: [{ market: 'US', open: '09:30', close: '16:00', timezone: 'America/New_York' }],
  },
  kiwoom: {
    apiBaseUrl: 'https://openapi.kiwoom.com',
    websocketUrl: null,
    rateLimitPerMinute: 60,
    marketHours: [{ market: 'KR', open: '09:00', close: '15:30', timezone: 'Asia/Seoul' }],
  },
  binance: {
    apiBaseUrl: 'https://api.binance.com',
    websocketUrl: 'wss://stream.binance.com:9443/ws',
    rateLimitPerMinute: 1200,
    marketHours: [{ market: 'CRYPTO', open: '00:00', close: '23:59', timezone: 'UTC' }],
  },
  upbit: {
    apiBaseUrl: 'https://api.upbit.com',
    websocketUrl: 'wss://api.upbit.com/websocket/v1',
    rateLimitPerMinute: 600,
    marketHours: [{ market: 'CRYPTO', open: '00:00', close: '23:59', timezone: 'Asia/Seoul' }],
  },
}

export function isSupportedBroker(value: unknown): value is BrokerType {
  return typeof value === 'string' && value in BROKER_ENDPOINTS
}
