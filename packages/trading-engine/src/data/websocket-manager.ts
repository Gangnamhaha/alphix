import { EventEmitter } from 'node:events'

type DataHandler = (payload: unknown) => void
type ErrorHandler = (error: Error) => void
type ReconnectHandler = (connectionId: string, attempt: number) => void

export interface WebSocketLike {
  onopen?: () => void
  onmessage?: (event: { data: string }) => void
  onerror?: (error: Error) => void
  onclose?: () => void
  close(): void
  send(data: string): void
}

type WebSocketFactory = (url: string) => WebSocketLike

type ConnectionState = {
  id: string
  url: string
  socket: WebSocketLike
  reconnectAttempts: number
  heartbeatTimer?: ReturnType<typeof setInterval>
  reconnectTimer?: ReturnType<typeof setTimeout>
  closedManually: boolean
}

type ConnectionConfig = {
  heartbeatIntervalMs?: number
  reconnectBaseDelayMs?: number
  reconnectMaxDelayMs?: number
  maxReconnectAttempts?: number
}

const DEFAULT_CONFIG: Required<ConnectionConfig> = {
  heartbeatIntervalMs: 15_000,
  reconnectBaseDelayMs: 250,
  reconnectMaxDelayMs: 5_000,
  maxReconnectAttempts: 5,
}

export class WebSocketManager extends EventEmitter {
  private readonly connections = new Map<string, ConnectionState>()
  private readonly config: Required<ConnectionConfig>

  constructor(
    private readonly socketFactory: WebSocketFactory,
    config: ConnectionConfig = {}
  ) {
    super()
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  onData(listener: DataHandler): () => void {
    this.on('data', listener)
    return () => this.off('data', listener)
  }

  onError(listener: ErrorHandler): () => void {
    this.on('error', listener)
    return () => this.off('error', listener)
  }

  onReconnect(listener: ReconnectHandler): () => void {
    this.on('reconnect', listener)
    return () => this.off('reconnect', listener)
  }

  connect(connectionId: string, url: string): void {
    if (this.connections.has(connectionId)) return

    const socket = this.socketFactory(url)
    const state: ConnectionState = {
      id: connectionId,
      url,
      socket,
      reconnectAttempts: 0,
      closedManually: false,
    }

    this.bindSocket(state)
    this.connections.set(connectionId, state)
  }

  disconnect(connectionId: string): void {
    const state = this.connections.get(connectionId)
    if (!state) return

    state.closedManually = true
    this.clearTimers(state)
    state.socket.close()
    this.connections.delete(connectionId)
  }

  disconnectAll(): void {
    for (const id of this.connections.keys()) {
      this.disconnect(id)
    }
  }

  isConnected(connectionId: string): boolean {
    return this.connections.has(connectionId)
  }

  private bindSocket(state: ConnectionState): void {
    state.socket.onopen = () => {
      state.reconnectAttempts = 0
      this.startHeartbeat(state)
    }

    state.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as unknown
        this.emit('data', payload)
      } catch {
        this.emit('error', new Error(`Invalid message payload on ${state.id}`))
      }
    }

    state.socket.onerror = (error) => {
      this.emit('error', error)
    }

    state.socket.onclose = () => {
      this.clearTimers(state)

      if (state.closedManually || !this.connections.has(state.id)) {
        return
      }

      this.scheduleReconnect(state)
    }
  }

  private startHeartbeat(state: ConnectionState): void {
    this.clearHeartbeat(state)
    state.heartbeatTimer = setInterval(() => {
      state.socket.send(JSON.stringify({ type: 'PING', ts: Date.now() }))
    }, this.config.heartbeatIntervalMs)
  }

  private scheduleReconnect(state: ConnectionState): void {
    if (state.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.connections.delete(state.id)
      this.emit('error', new Error(`Reconnect attempts exhausted for ${state.id}`))
      return
    }

    state.reconnectAttempts += 1
    const delay = Math.min(this.config.reconnectBaseDelayMs * 2 ** (state.reconnectAttempts - 1), this.config.reconnectMaxDelayMs)

    state.reconnectTimer = setTimeout(() => {
      const nextSocket = this.socketFactory(state.url)
      state.socket = nextSocket
      this.bindSocket(state)
      this.emit('reconnect', state.id, state.reconnectAttempts)
    }, delay)
  }

  private clearTimers(state: ConnectionState): void {
    this.clearHeartbeat(state)
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer)
      state.reconnectTimer = undefined
    }
  }

  private clearHeartbeat(state: ConnectionState): void {
    if (state.heartbeatTimer) {
      clearInterval(state.heartbeatTimer)
      state.heartbeatTimer = undefined
    }
  }
}
