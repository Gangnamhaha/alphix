import { describe, expect, test } from 'bun:test'
import { encrypt, decrypt } from '../encryption'

const KEY = 'a]b$c&d*e(f)g#h!i@j^k%l+m=n~o.p!'

describe('encryption', () => {
  test('encrypt and decrypt roundtrip', () => {
    const plaintext = 'my-secret-api-key'
    const encrypted = encrypt(plaintext, KEY)
    const decrypted = decrypt(encrypted, KEY)
    expect(decrypted).toBe(plaintext)
  })

  test('wrong key throws', () => {
    const encrypted = encrypt('test', KEY)
    const wrongKey = 'x'.repeat(32)
    expect(() => decrypt(encrypted, wrongKey)).toThrow()
  })

  test('invalid key length throws', () => {
    expect(() => encrypt('test', 'short')).toThrow('Encryption key must be 32 bytes')
  })
})
