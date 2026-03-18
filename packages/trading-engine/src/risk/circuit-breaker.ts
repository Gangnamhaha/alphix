export type CircuitBreakerState = {
  isActive: boolean
  triggeredAt?: Date
  reason?: string
}

export class CircuitBreaker {
  private state: CircuitBreakerState = { isActive: false }

  trigger(reason: string): CircuitBreakerState {
    if (this.state.isActive) return this.getState()

    this.state = {
      isActive: true,
      triggeredAt: new Date(),
      reason,
    }

    return this.getState()
  }

  reset(): CircuitBreakerState {
    this.state = { isActive: false }
    return this.getState()
  }

  isActive(): boolean {
    return this.state.isActive
  }

  getState(): CircuitBreakerState {
    return {
      isActive: this.state.isActive,
      triggeredAt: this.state.triggeredAt,
      reason: this.state.reason,
    }
  }
}
