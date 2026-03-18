type TelegramCommand = '/status' | '/positions' | '/stop' | '/start'

type TelegramBotHandlers = {
  onStatus: () => string
  onPositions: () => string
  onStop: () => string
  onStart: () => string
}

const DEFAULT_HANDLERS: TelegramBotHandlers = {
  onStatus: () => 'Engine status: running',
  onPositions: () => 'Positions: []',
  onStop: () => 'Engine stopped',
  onStart: () => 'Engine started',
}

export class MockTelegramBot {
  private readonly handlers: TelegramBotHandlers

  constructor(handlers: Partial<TelegramBotHandlers> = {}) {
    this.handlers = { ...DEFAULT_HANDLERS, ...handlers }
  }

  handleCommand(command: string): string {
    switch (command as TelegramCommand) {
      case '/status':
        return this.handlers.onStatus()
      case '/positions':
        return this.handlers.onPositions()
      case '/stop':
        return this.handlers.onStop()
      case '/start':
        return this.handlers.onStart()
      default:
        return `Unknown command: ${command}`
    }
  }
}
