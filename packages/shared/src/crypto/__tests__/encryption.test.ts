import { describe, expect, test } from 'bun:test'
import {
  decrypt,
  decryptFromString,
  deserializeEncryptedData,
  encrypt,
  encryptToString,
  serializeEncryptedData,
} from '../encryption'

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

  test('serialize and deserialize encrypted payload', () => {
    const encrypted = encrypt('serialized-secret', KEY)
    const serialized = serializeEncryptedData(encrypted)
    const deserialized = deserializeEncryptedData(serialized)
    const decrypted = decrypt(deserialized, KEY)

    expect(decrypted).toBe('serialized-secret')
  })

  test('encrypt and decrypt with string helpers', () => {
    const serialized = encryptToString('string-secret', KEY)
    const decrypted = decryptFromString(serialized, KEY)
    expect(decrypted).toBe('string-secret')
  })

  test('deserialize invalid encrypted payload throws', () => {
    expect(() => deserializeEncryptedData('not-json')).toThrow('Invalid encrypted data payload')
    expect(() => deserializeEncryptedData('{"ciphertext": "a"}')).toThrow(
      'Invalid encrypted data payload',
    )
  })
})
