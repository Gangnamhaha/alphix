import '../../bun-test'
import { NotificationManager } from '../notification-manager'
import { MockTelegramBot } from '../telegram-bot'

describe('NotificationManager', () => {
  test('queues notifications and flushes in batches to webhook channel', async () => {
    const batches: number[] = []
    const manager = new NotificationManager({
      batchSize: 2,
      webhookSender: async (messages) => {
        batches.push(messages.length)
      },
    })

    manager.enqueue({ title: 'A', body: 'one', level: 'info' })
    manager.enqueue({ title: 'B', body: 'two', level: 'warning' })
    manager.enqueue({ title: 'C', body: 'three', level: 'error' })

    expect(manager.getQueueLength()).toBe(3)

    const processed = await manager.flush()
    expect(processed).toBe(3)
    expect(manager.getQueueLength()).toBe(0)
    expect(batches.join(',')).toBe('2,1')
  })

  test('flushes empty queue as zero', async () => {
    const manager = new NotificationManager()
    const processed = await manager.flush()
    expect(processed).toBe(0)
  })
})

describe('MockTelegramBot', () => {
  test('handles /status /positions /stop /start commands', () => {
    const bot = new MockTelegramBot({
      onStatus: () => 'status-ok',
      onPositions: () => 'positions-ok',
      onStop: () => 'stop-ok',
      onStart: () => 'start-ok',
    })

    expect(bot.handleCommand('/status')).toBe('status-ok')
    expect(bot.handleCommand('/positions')).toBe('positions-ok')
    expect(bot.handleCommand('/stop')).toBe('stop-ok')
    expect(bot.handleCommand('/start')).toBe('start-ok')
  })

  test('returns unknown command message for unsupported input', () => {
    const bot = new MockTelegramBot()
    expect(bot.handleCommand('/help')).toBe('Unknown command: /help')
  })
})
