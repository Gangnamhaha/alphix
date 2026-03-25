import {
  BROKER_ENDPOINTS,
  encryptToString,
  isSupportedBroker,
  type BrokerType,
  type Database,
} from '@alphix/shared'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'

type BrokerConfigRow = Database['public']['Tables']['broker_configs']['Row']

const SECRET_MASK = '********'

export type BrokerCapabilityReason =
  | 'MOCK_SESSION_UNSUPPORTED'
  | 'ADMIN_ENV_UNAVAILABLE'
  | 'ADMIN_CLIENT_UNAVAILABLE'
  | 'ENCRYPTION_KEY_UNAVAILABLE'
  | 'USER_ROW_NOT_FOUND'
  | 'MULTIPLE_USER_ROWS'
  | 'MULTIPLE_BROKER_CONFIGS'
  | 'UNSUPPORTED_STORED_BROKER_TYPE'

export interface BrokerSecretState {
  isSet: boolean
  maskedValue: string | null
}

export interface BrokerSettingsConfigView {
  id: number
  brokerType: BrokerType
  isActive: boolean
  apiKey: BrokerSecretState
  secret: BrokerSecretState
}

export interface BrokerSettingsCapabilities {
  canReadStoredConfig: boolean
  canPatchConfig: boolean
  canSaveSecrets: boolean
  reasons: BrokerCapabilityReason[]
}

export interface BrokerSettingsSnapshot {
  supportedBrokers: BrokerType[]
  currentConfig: BrokerSettingsConfigView | null
  capabilities: BrokerSettingsCapabilities
}

export interface BrokerSettingsIdentity {
  email: string
  isMockSession: boolean
}

interface PatchBrokerSettingsPayload {
  brokerType?: unknown
  isActive?: unknown
  apiKey?: unknown
  secret?: unknown
}

interface ResolvedUser {
  userId: number | null
  reason: BrokerCapabilityReason | null
}

interface ResolvedBrokerConfig {
  row: BrokerConfigRow | null
  reason: BrokerCapabilityReason | null
}

export interface BrokerRuntimeConfig {
  id: number
  userId: number
  brokerType: BrokerType
  isActive: boolean
  encryptedApiKey: string | null
  encryptedSecret: string | null
}

export class BrokerSettingsServiceError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'BrokerSettingsServiceError'
    this.status = status
  }
}

function hasAdminSupabaseEnv() {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

function hasValidEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY
  return Boolean(key && key.length === 32)
}

function getSupportedBrokers() {
  return Object.keys(BROKER_ENDPOINTS).filter(isSupportedBroker)
}

function buildSecretState(value: string | null): BrokerSecretState {
  if (!value) {
    return {
      isSet: false,
      maskedValue: null,
    }
  }

  return {
    isSet: true,
    maskedValue: SECRET_MASK,
  }
}

function mapBrokerConfig(row: BrokerConfigRow): BrokerSettingsConfigView | null {
  if (!isSupportedBroker(row.broker_type)) {
    return null
  }

  return {
    id: row.id,
    brokerType: row.broker_type,
    isActive: Boolean(row.is_active),
    apiKey: buildSecretState(row.encrypted_api_key),
    secret: buildSecretState(row.encrypted_secret),
  }
}

function assertRecord(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new BrokerSettingsServiceError(400, 'Invalid request body')
  }
}

function readOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'boolean') {
    throw new BrokerSettingsServiceError(400, `${field} must be a boolean`)
  }

  return value
}

function readOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new BrokerSettingsServiceError(400, `${field} must be a string`)
  }

  return value.trim()
}

function requireEncryptionKeyForSecretSave(field: string) {
  const key = process.env.ENCRYPTION_KEY

  if (!key || key.length !== 32) {
    throw new BrokerSettingsServiceError(
      503,
      `Cannot save ${field}: ENCRYPTION_KEY must be 32 bytes`,
    )
  }

  return key
}

export function requireBrokerRuntimeEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY

  if (!key || key.length !== 32) {
    throw new BrokerSettingsServiceError(
      503,
      'Broker reads are unavailable: ENCRYPTION_KEY must be 32 bytes',
    )
  }

  return key
}

async function resolveUserIdByEmail(email: string): Promise<ResolvedUser> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase.from('users').select('id').eq('email', email)

  if (error) {
    throw new BrokerSettingsServiceError(500, error.message)
  }

  if (!data.length) {
    return {
      userId: null,
      reason: 'USER_ROW_NOT_FOUND',
    }
  }

  if (data.length > 1) {
    return {
      userId: null,
      reason: 'MULTIPLE_USER_ROWS',
    }
  }

  return {
    userId: data[0].id,
    reason: null,
  }
}

async function resolveBrokerConfigByUserId(userId: number): Promise<ResolvedBrokerConfig> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('broker_configs')
    .select('id, user_id, broker_type, encrypted_api_key, encrypted_secret, is_active')
    .eq('user_id', userId)

  if (error) {
    throw new BrokerSettingsServiceError(500, error.message)
  }

  if (data.length > 1) {
    return {
      row: null,
      reason: 'MULTIPLE_BROKER_CONFIGS',
    }
  }

  return {
    row: data[0] ?? null,
    reason: null,
  }
}

export async function getBrokerRuntimeConfig(
  identity: BrokerSettingsIdentity,
): Promise<BrokerRuntimeConfig> {
  if (identity.isMockSession) {
    throw new BrokerSettingsServiceError(403, 'Broker reads are unavailable in mock session')
  }

  if (!hasAdminSupabaseEnv()) {
    throw new BrokerSettingsServiceError(
      503,
      'Broker reads are unavailable: missing admin Supabase environment',
    )
  }

  const userResolution = await resolveUserIdByEmail(identity.email)

  if (userResolution.reason === 'USER_ROW_NOT_FOUND') {
    throw new BrokerSettingsServiceError(
      409,
      'Broker reads are unavailable: no users row found for this account',
    )
  }

  if (userResolution.reason === 'MULTIPLE_USER_ROWS') {
    throw new BrokerSettingsServiceError(
      409,
      'Broker reads are unavailable: multiple users rows match this account',
    )
  }

  if (userResolution.userId === null) {
    throw new BrokerSettingsServiceError(409, 'Broker reads are unavailable for this account')
  }

  const configResolution = await resolveBrokerConfigByUserId(userResolution.userId)

  if (configResolution.reason === 'MULTIPLE_BROKER_CONFIGS') {
    throw new BrokerSettingsServiceError(
      409,
      'Broker reads are unavailable: multiple broker configs exist for this user',
    )
  }

  if (!configResolution.row) {
    throw new BrokerSettingsServiceError(
      409,
      'Broker reads are unavailable: no broker config found for this account',
    )
  }

  if (!isSupportedBroker(configResolution.row.broker_type)) {
    throw new BrokerSettingsServiceError(
      409,
      'Broker reads are unavailable: stored broker type is unsupported',
    )
  }

  return {
    id: configResolution.row.id,
    userId: userResolution.userId,
    brokerType: configResolution.row.broker_type,
    isActive: Boolean(configResolution.row.is_active),
    encryptedApiKey: configResolution.row.encrypted_api_key,
    encryptedSecret: configResolution.row.encrypted_secret,
  }
}

export async function getBrokerSettingsSnapshot(
  identity: BrokerSettingsIdentity,
): Promise<BrokerSettingsSnapshot> {
  const reasons: BrokerCapabilityReason[] = []
  const capabilities: BrokerSettingsCapabilities = {
    canReadStoredConfig: true,
    canPatchConfig: true,
    canSaveSecrets: hasValidEncryptionKey(),
    reasons,
  }

  if (!capabilities.canSaveSecrets) {
    reasons.push('ENCRYPTION_KEY_UNAVAILABLE')
  }

  if (identity.isMockSession) {
    reasons.push('MOCK_SESSION_UNSUPPORTED')
    capabilities.canReadStoredConfig = false
    capabilities.canPatchConfig = false

    return {
      supportedBrokers: getSupportedBrokers(),
      currentConfig: null,
      capabilities,
    }
  }

  if (!hasAdminSupabaseEnv()) {
    reasons.push('ADMIN_ENV_UNAVAILABLE')
    capabilities.canReadStoredConfig = false
    capabilities.canPatchConfig = false

    return {
      supportedBrokers: getSupportedBrokers(),
      currentConfig: null,
      capabilities,
    }
  }

  let userResolution: ResolvedUser

  try {
    userResolution = await resolveUserIdByEmail(identity.email)
  } catch (error) {
    if (error instanceof BrokerSettingsServiceError && error.status === 500) {
      reasons.push('ADMIN_CLIENT_UNAVAILABLE')
      capabilities.canReadStoredConfig = false
      capabilities.canPatchConfig = false

      return {
        supportedBrokers: getSupportedBrokers(),
        currentConfig: null,
        capabilities,
      }
    }

    throw error
  }

  if (userResolution.reason || userResolution.userId === null) {
    reasons.push(userResolution.reason ?? 'USER_ROW_NOT_FOUND')
    capabilities.canReadStoredConfig = false
    capabilities.canPatchConfig = false

    return {
      supportedBrokers: getSupportedBrokers(),
      currentConfig: null,
      capabilities,
    }
  }

  const configResolution = await resolveBrokerConfigByUserId(userResolution.userId)

  if (configResolution.reason) {
    reasons.push(configResolution.reason)
    capabilities.canReadStoredConfig = false
    capabilities.canPatchConfig = false

    return {
      supportedBrokers: getSupportedBrokers(),
      currentConfig: null,
      capabilities,
    }
  }

  const mappedConfig = configResolution.row ? mapBrokerConfig(configResolution.row) : null

  if (configResolution.row && !mappedConfig) {
    reasons.push('UNSUPPORTED_STORED_BROKER_TYPE')
    capabilities.canReadStoredConfig = false
    capabilities.canPatchConfig = false
  }

  return {
    supportedBrokers: getSupportedBrokers(),
    currentConfig: mappedConfig,
    capabilities,
  }
}

function resolveEncryptedValue(
  input: string | undefined,
  existingValue: string | null,
  field: string,
): string | null {
  if (input === undefined || input === '') {
    return existingValue
  }

  const key = requireEncryptionKeyForSecretSave(field)
  return encryptToString(input, key)
}

export async function updateBrokerSettings(
  identity: BrokerSettingsIdentity,
  body: unknown,
): Promise<BrokerSettingsConfigView> {
  if (identity.isMockSession) {
    throw new BrokerSettingsServiceError(
      403,
      'Broker settings update is unavailable in mock session',
    )
  }

  if (!hasAdminSupabaseEnv()) {
    throw new BrokerSettingsServiceError(
      503,
      'Broker settings update is unavailable: missing admin Supabase environment',
    )
  }

  assertRecord(body)

  const payload = body as PatchBrokerSettingsPayload
  const brokerType = readOptionalString(payload.brokerType, 'brokerType')
  const isActive = readOptionalBoolean(payload.isActive, 'isActive')
  const apiKey = readOptionalString(payload.apiKey, 'apiKey')
  const secret = readOptionalString(payload.secret, 'secret')

  if (
    brokerType === undefined &&
    isActive === undefined &&
    apiKey === undefined &&
    secret === undefined
  ) {
    throw new BrokerSettingsServiceError(400, 'At least one update field is required')
  }

  const userResolution = await resolveUserIdByEmail(identity.email)

  if (userResolution.reason === 'USER_ROW_NOT_FOUND') {
    throw new BrokerSettingsServiceError(
      409,
      'Cannot update broker settings: no users row found for this account',
    )
  }

  if (userResolution.reason === 'MULTIPLE_USER_ROWS') {
    throw new BrokerSettingsServiceError(
      409,
      'Cannot update broker settings: multiple users rows match this account',
    )
  }

  if (userResolution.userId === null) {
    throw new BrokerSettingsServiceError(409, 'Cannot update broker settings for this account')
  }

  const configResolution = await resolveBrokerConfigByUserId(userResolution.userId)

  if (configResolution.reason === 'MULTIPLE_BROKER_CONFIGS') {
    throw new BrokerSettingsServiceError(
      409,
      'Cannot update broker settings: multiple broker configs exist for this user',
    )
  }

  const existingRow = configResolution.row
  const nextBrokerType = brokerType ?? existingRow?.broker_type

  if (!nextBrokerType) {
    throw new BrokerSettingsServiceError(
      400,
      'brokerType is required when creating broker settings',
    )
  }

  if (!isSupportedBroker(nextBrokerType)) {
    throw new BrokerSettingsServiceError(400, 'Unsupported brokerType')
  }

  const nextApiKey = resolveEncryptedValue(apiKey, existingRow?.encrypted_api_key ?? null, 'apiKey')
  const nextSecret = resolveEncryptedValue(secret, existingRow?.encrypted_secret ?? null, 'secret')
  const nextIsActive = isActive ?? Boolean(existingRow?.is_active ?? true)

  const supabase = createAdminSupabaseClient()
  const values = {
    user_id: userResolution.userId,
    broker_type: nextBrokerType,
    encrypted_api_key: nextApiKey,
    encrypted_secret: nextSecret,
    is_active: nextIsActive,
  }

  const { data, error } = existingRow
    ? await supabase
        .from('broker_configs')
        .update(values)
        .eq('id', existingRow.id)
        .select('id, user_id, broker_type, encrypted_api_key, encrypted_secret, is_active')
        .maybeSingle()
    : await supabase
        .from('broker_configs')
        .insert(values)
        .select('id, user_id, broker_type, encrypted_api_key, encrypted_secret, is_active')
        .maybeSingle()

  if (error) {
    throw new BrokerSettingsServiceError(500, error.message)
  }

  if (!data) {
    throw new BrokerSettingsServiceError(500, 'Broker settings save failed')
  }

  const mapped = mapBrokerConfig(data)

  if (!mapped) {
    throw new BrokerSettingsServiceError(
      500,
      'Broker settings save failed: unsupported stored broker type',
    )
  }

  return mapped
}
