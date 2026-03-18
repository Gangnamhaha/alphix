declare global {
  function describe(name: string, fn: () => void | Promise<void>): void
  function test(name: string, fn: () => void | Promise<void>): void
  function expect<T>(value: T): {
    toBe(expected: unknown): void
    toContain(expected: string): void
    toEqual(expected: unknown): void
    toMatchObject(expected: Record<string, unknown>): void
    toBeCloseTo(expected: number, precision?: number): void
    toBeInstanceOf(expected: new (...args: never[]) => unknown): void
    toThrow(expected?: string | RegExp): void
    resolves: {
      toBe(expected: unknown): Promise<void>
      toContain(expected: string): Promise<void>
      toMatchObject(expected: Record<string, unknown>): Promise<void>
    }
    rejects: {
      toThrow(expected?: string | RegExp): Promise<void>
    }
  }
}

export {}
