export interface ExecutionState {
  userKey: string
  running: boolean
  startedAt: string
  lastSeenAt: string
  stopReason: string | null
}

export interface ExecutionLogItem {
  id: string
  level: 'info' | 'warn'
  event: string
  message: string
  timestamp: string
}

const executionStore = new Map<string, ExecutionState>()
const executionLogStore = new Map<string, ExecutionLogItem[]>()
const LOG_LIMIT = 50

function appendExecutionLog(
  userKey: string,
  level: ExecutionLogItem['level'],
  event: string,
  message: string,
) {
  const normalizedUserKey = userKey.trim().toLowerCase()
  const timestamp = new Date().toISOString()
  const nextLog: ExecutionLogItem = {
    id: `${normalizedUserKey}-${event}-${Date.now()}`,
    level,
    event,
    message,
    timestamp,
  }
  const previousLogs = executionLogStore.get(normalizedUserKey) ?? []
  executionLogStore.set(normalizedUserKey, [nextLog, ...previousLogs].slice(0, LOG_LIMIT))
}

export function ensureExecutionRunning(userKey: string) {
  const normalizedUserKey = userKey.trim().toLowerCase()
  const now = new Date().toISOString()
  const existing = executionStore.get(normalizedUserKey)

  if (!existing) {
    const created: ExecutionState = {
      userKey: normalizedUserKey,
      running: true,
      startedAt: now,
      lastSeenAt: now,
      stopReason: null,
    }
    executionStore.set(normalizedUserKey, created)
    appendExecutionLog(normalizedUserKey, 'info', 'EXECUTION_STARTED', 'Trading execution started')
    return created
  }

  const resumed: ExecutionState = {
    ...existing,
    running: true,
    lastSeenAt: now,
    stopReason: null,
  }
  executionStore.set(normalizedUserKey, resumed)

  if (!existing.running) {
    appendExecutionLog(normalizedUserKey, 'info', 'EXECUTION_RESUMED', 'Trading execution resumed')
  }

  return resumed
}

export function stopExecution(userKey: string, reason: string) {
  const normalizedUserKey = userKey.trim().toLowerCase()
  const now = new Date().toISOString()
  const existing = executionStore.get(normalizedUserKey)

  const stopped: ExecutionState = {
    userKey: normalizedUserKey,
    running: false,
    startedAt: existing?.startedAt ?? now,
    lastSeenAt: now,
    stopReason: reason,
  }

  executionStore.set(normalizedUserKey, stopped)
  appendExecutionLog(
    normalizedUserKey,
    'warn',
    'EXECUTION_STOPPED',
    `Trading execution stopped: ${reason}`,
  )
  return stopped
}

export function getExecutionState(userKey: string) {
  return executionStore.get(userKey.trim().toLowerCase()) ?? null
}

export function getExecutionLogs(userKey: string) {
  return executionLogStore.get(userKey.trim().toLowerCase()) ?? []
}
