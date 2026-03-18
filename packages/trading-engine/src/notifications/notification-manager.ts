type NotificationLevel = 'info' | 'warning' | 'error'

export type NotificationMessage = {
  title: string
  body: string
  level: NotificationLevel
  timestamp: Date
}

interface NotificationChannel {
  send(messages: NotificationMessage[]): Promise<void>
}

class ConsoleChannel implements NotificationChannel {
  async send(messages: NotificationMessage[]): Promise<void> {
    for (const message of messages) {
      const payload = `[${message.level.toUpperCase()}] ${message.title}: ${message.body}`
      console.log(payload)
    }
  }
}

class WebhookChannel implements NotificationChannel {
  constructor(private readonly sender: (messages: NotificationMessage[]) => Promise<void>) {}

  async send(messages: NotificationMessage[]): Promise<void> {
    await this.sender(messages)
  }
}

type NotificationManagerConfig = {
  batchSize?: number
  webhookSender?: (messages: NotificationMessage[]) => Promise<void>
}

export class NotificationManager {
  private readonly queue: NotificationMessage[] = []
  private readonly channels = new Map<string, NotificationChannel>()
  private readonly batchSize: number

  constructor(config: NotificationManagerConfig = {}) {
    this.batchSize = config.batchSize ?? 20
    this.channels.set('console', new ConsoleChannel())

    if (config.webhookSender) {
      this.channels.set('webhook', new WebhookChannel(config.webhookSender))
    }
  }

  enqueue(message: Omit<NotificationMessage, 'timestamp'>): void {
    this.queue.push({
      ...message,
      timestamp: new Date(),
    })
  }

  async flush(): Promise<number> {
    if (this.queue.length === 0) return 0

    let processed = 0
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize)
      await Promise.all([...this.channels.values()].map((channel) => channel.send(batch)))
      processed += batch.length
    }

    return processed
  }

  getQueueLength(): number {
    return this.queue.length
  }
}
