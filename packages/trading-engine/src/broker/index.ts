import type { BrokerAdapter, BrokerType } from '@alphix/shared'
import { AlpacaBrokerAdapter } from './alpaca'
import { BinanceBrokerAdapter } from './binance'
import { KisBrokerAdapter } from './kis'
import { KisOverseasBrokerAdapter } from './kis-overseas'
import { KiwoomBrokerAdapter } from './kiwoom'
import { UpbitBrokerAdapter } from './upbit'

type BrokerAdapterConfig = {
  apiKey: string
  secretKey: string
  isPaper?: boolean
}

export { KisBrokerAdapter } from './kis'
export { KisOverseasBrokerAdapter } from './kis-overseas'
export { AlpacaBrokerAdapter } from './alpaca'
export { KiwoomBrokerAdapter } from './kiwoom'
export { BinanceBrokerAdapter } from './binance'
export { UpbitBrokerAdapter } from './upbit'

export function createBrokerAdapter(type: BrokerType, config: BrokerAdapterConfig): BrokerAdapter {
  switch (type) {
    case 'kis':
      return new KisBrokerAdapter(config)
    case 'kis-overseas':
      return new KisOverseasBrokerAdapter(config)
    case 'alpaca':
      return new AlpacaBrokerAdapter(config)
    case 'kiwoom':
      return new KiwoomBrokerAdapter(config)
    case 'binance':
      return new BinanceBrokerAdapter(config)
    case 'upbit':
      return new UpbitBrokerAdapter(config)
    default: {
      const exhaustiveCheck: never = type
      throw new Error(`Unsupported broker type: ${String(exhaustiveCheck)}`)
    }
  }
}
