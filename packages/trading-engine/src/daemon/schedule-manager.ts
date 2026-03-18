import type { Market } from '@alphix/shared'

export type MarketSession = {
  market: Market
  isOpen: boolean
  opensAt: string
  closesAt: string
}

export class ScheduleManager {
  isMarketOpen(market: Market, now: Date = new Date()): boolean {
    return this.getSession(market, now).isOpen
  }

  getSession(market: Market, now: Date = new Date()): MarketSession {
    switch (market) {
      case 'KR':
        return this.krSession(now)
      case 'US':
        return this.usSession(now)
      case 'CRYPTO':
        return {
          market,
          isOpen: true,
          opensAt: '00:00',
          closesAt: '24:00',
        }
      default: {
        const exhaustiveCheck: never = market
        throw new Error(`Unsupported market: ${String(exhaustiveCheck)}`)
      }
    }
  }

  private krSession(now: Date): MarketSession {
    const day = now.getUTCDay()
    const minutes = now.getUTCHours() * 60 + now.getUTCMinutes() + 9 * 60
    const normalizedMinutes = ((minutes % 1440) + 1440) % 1440
    const isWeekday = day >= 1 && day <= 5
    const isOpen = isWeekday && normalizedMinutes >= 9 * 60 && normalizedMinutes <= 15 * 60 + 30

    return {
      market: 'KR',
      isOpen,
      opensAt: '09:00 KST',
      closesAt: '15:30 KST',
    }
  }

  private usSession(now: Date): MarketSession {
    const day = now.getUTCDay()
    const minutes = now.getUTCHours() * 60 + now.getUTCMinutes()
    const isWeekday = day >= 1 && day <= 5
    const isOpen = isWeekday && minutes >= 14 * 60 + 30 && minutes <= 21 * 60

    return {
      market: 'US',
      isOpen,
      opensAt: '09:30 ET',
      closesAt: '16:00 ET',
    }
  }
}
