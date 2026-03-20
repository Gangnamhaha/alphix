export interface ExecutionState {
  userKey: string
  running: boolean
  startedAt: string
  lastSeenAt: string
  stopReason: string | null
}

const executionStore = new Map<string, ExecutionState>()

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
    return created
  }

  const resumed: ExecutionState = {
    ...existing,
    running: true,
    lastSeenAt: now,
    stopReason: null,
  }
  executionStore.set(normalizedUserKey, resumed)
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
  return stopped
}

export function getExecutionState(userKey: string) {
  return executionStore.get(userKey.trim().toLowerCase()) ?? null
}
