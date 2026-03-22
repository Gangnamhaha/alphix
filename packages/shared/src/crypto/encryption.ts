import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

export interface EncryptedData {
  ciphertext: string
  iv: string
  tag: string
}

function isEncryptedData(value: unknown): value is EncryptedData {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.ciphertext === 'string' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.tag === 'string'
  )
}

export function encrypt(plaintext: string, key: string): EncryptedData {
  if (key.length !== 32) throw new Error('Encryption key must be 32 bytes')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key), iv)
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
  ciphertext += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  return { ciphertext, iv: iv.toString('hex'), tag }
}

export function decrypt(encrypted: EncryptedData, key: string): string {
  if (key.length !== 32) throw new Error('Encryption key must be 32 bytes')
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key),
    Buffer.from(encrypted.iv, 'hex'),
  )
  decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'))
  let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8')
  plaintext += decipher.final('utf8')
  return plaintext
}

export function serializeEncryptedData(encrypted: EncryptedData): string {
  return JSON.stringify(encrypted)
}

export function deserializeEncryptedData(value: string): EncryptedData {
  let parsed: unknown

  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error('Invalid encrypted data payload')
  }

  if (!isEncryptedData(parsed)) {
    throw new Error('Invalid encrypted data payload')
  }

  return parsed
}

export function encryptToString(plaintext: string, key: string): string {
  return serializeEncryptedData(encrypt(plaintext, key))
}

export function decryptFromString(value: string, key: string): string {
  return decrypt(deserializeEncryptedData(value), key)
}
