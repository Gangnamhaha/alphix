declare module 'bun:test' {
  interface Matchers {
    toBe(expected: unknown): void
    toEqual(expected: unknown): void
    toMatchObject(expected: Record<string, unknown>): void
    toBeInstanceOf(expected: new (...args: never[]) => unknown): void
  }

  export function describe(name: string, fn: () => void | Promise<void>): void
  export function test(name: string, fn: () => void | Promise<void>): void
  export function expect<T>(value: T): Matchers & {
    resolves: Matchers
    rejects: Matchers
  }
}
