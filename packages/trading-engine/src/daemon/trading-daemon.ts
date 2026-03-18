import type { Market, OHLCV, Signal, Strategy } from '@alphix/shared'
import { ScheduleManager } from './schedule-manager'

type DaemonStrategy = {
  id: string
  symbol: string
  market: Market
  strategy: Strategy
  enabled: boolean
}

type DataProvider = (symbol: string) => Promise<OHLCV[]>
type OrderExecutor = (input: { strategyId: string; symbol: string; signal: Exclude<Signal, 'HOLD'> }) => Promise<void>

type TradingDaemonDependencies = {
  scheduleManager?: ScheduleManager
  dataProvider: DataProvider
  orderExecutor: OrderExecutor
}

type DaemonCycleResult = {
  executedStrategies: number
  errors: { strategyId: string; message: string }[]
}

export class TradingDaemon {
  private readonly strategies = new Map<string, DaemonStrategy>()
  private readonly scheduleManager: ScheduleManager
  private running = false

  constructor(private readonly dependencies: TradingDaemonDependencies) {
    this.scheduleManager = dependencies.scheduleManager ?? new ScheduleManager()
  }

  registerStrategy(input: Omit<DaemonStrategy, 'enabled'>): void {
    this.strategies.set(input.id, {
      ...input,
      enabled: true,
    })
  }

  start(): void {
    this.running = true
  }

  stop(): void {
    this.running = false
  }

  isRunning(): boolean {
    return this.running
  }

  async runCycle(now: Date = new Date()): Promise<DaemonCycleResult> {
    if (!this.running) {
      return { executedStrategies: 0, errors: [] }
    }

    const errors: { strategyId: string; message: string }[] = []
    let executedStrategies = 0

    for (const strategy of this.strategies.values()) {
      if (!strategy.enabled || !this.scheduleManager.isMarketOpen(strategy.market, now)) {
        continue
      }

      try {
        const data = await this.dependencies.dataProvider(strategy.symbol)
        const signal = await strategy.strategy.getSignal(data)

        if (signal !== 'HOLD') {
          await this.dependencies.orderExecutor({
            strategyId: strategy.id,
            symbol: strategy.symbol,
            signal,
          })
        }

        executedStrategies += 1
      } catch (error) {
        errors.push({
          strategyId: strategy.id,
          message: error instanceof Error ? error.message : 'Unknown strategy error',
        })
      }
    }

    return { executedStrategies, errors }
  }
}
