import '../../bun-test'
import { CircuitBreaker } from '../circuit-breaker'

describe('CircuitBreaker', () => {
  test('activates on trigger and stays active until reset', () => {
    const breaker = new CircuitBreaker()

    expect(breaker.isActive()).toBe(false)

    const triggered = breaker.trigger('Daily loss limit reached')
    expect(triggered.isActive).toBe(true)
    expect(triggered.reason).toBe('Daily loss limit reached')

    const secondTrigger = breaker.trigger('Another reason')
    expect(secondTrigger.reason).toBe('Daily loss limit reached')
    expect(breaker.isActive()).toBe(true)

    const reset = breaker.reset()
    expect(reset.isActive).toBe(false)
    expect(reset.reason).toBe(undefined)
  })
})
