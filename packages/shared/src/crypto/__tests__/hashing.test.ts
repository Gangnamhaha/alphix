import { describe, expect, test } from 'bun:test'
import { hashPassword, verifyPassword } from '../hashing'

describe('hashing', () => {
  test('hash and verify password', async () => {
    const hash = await hashPassword('test123')
    expect(await verifyPassword('test123', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })
})
