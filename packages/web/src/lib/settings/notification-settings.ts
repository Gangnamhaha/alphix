import { encryptToString, type Database } from '@alphix/shared'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'

type NotificationSettingsRow = Database['public']['Tables']['notification_settings']['Row']

const SECRET_MASK = '********'

export type NotificationWebhookCapabilityReason =
  | 'MOCK_SESSION_LOCAL_ONLY'
  | 'ADMIN_ENV_UNAVAILABLE'
  | 'ADMIN_CLIENT_UNAVAILABLE'
  | 'ENCRYPTION_KEY_UNAVAILABLE'
  | 'USER_ROW_NOT_FOUND'
  | 'MULTIPLE_USER_ROWS'
  | 'MULTIPLE_NOTIFICATION_SETTINGS'

export interface NotificationSecretState {
  isSet: boolean
  maskedValue: string | null
}

export interface NotificationWebhookCapabilities {
  canReadStoredWebhook: boolean
  canSaveWebhook: boolean
  reasons: NotificationWebhookCapabilityReason[]
}

export interface NotificationWebhookSnapshot {
  slackWebhook: NotificationSecretState
  capabilities: NotificationWebhookCapabilities
}

export interface NotificationSettingsIdentity {
  email: string
  isMockSession: boolean
}

interface ResolvedUser {
  userId: string | null
  reason: NotificationWebhookCapabilityReason | null
}

interface ResolvedNotificationSettings {
  row: NotificationSettingsRow | null
  reason: NotificationWebhookCapabilityReason | null
}

export class NotificationSettingsServiceError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'NotificationSettingsServiceError'
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

function buildSecretState(value: string | null): NotificationSecretState {
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

function requireEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY

  if (!key || key.length !== 32) {
    throw new NotificationSettingsServiceError(
      503,
      'Cannot save Slack webhook: ENCRYPTION_KEY must be 32 bytes',
    )
  }

  return key
}

function validateSlackWebhook(value: string) {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new NotificationSettingsServiceError(400, 'Slack webhook must be a valid URL')
  }

  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'hooks.slack.com' ||
    !parsed.pathname.startsWith('/services/')
  ) {
    throw new NotificationSettingsServiceError(
      400,
      'Slack webhook must use a valid hooks.slack.com URL',
    )
  }
}

async function resolveUserIdByEmail(email: string): Promise<ResolvedUser> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase.from('users').select('id').eq('email', email)

  if (error) {
    throw new NotificationSettingsServiceError(
      503,
      'Slack webhook storage is temporarily unavailable',
    )
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

async function resolveNotificationSettingsByUserId(
  userId: string,
): Promise<ResolvedNotificationSettings> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('notification_settings')
    .select('id, user_id, encrypted_slack_webhook, updated_at')
    .eq('user_id', userId)

  if (error) {
    throw new NotificationSettingsServiceError(
      503,
      'Slack webhook storage is temporarily unavailable',
    )
  }

  if (data.length > 1) {
    return {
      row: null,
      reason: 'MULTIPLE_NOTIFICATION_SETTINGS',
    }
  }

  return {
    row: data[0] ?? null,
    reason: null,
  }
}

export async function getNotificationWebhookSnapshot(
  identity: NotificationSettingsIdentity,
): Promise<NotificationWebhookSnapshot> {
  const reasons: NotificationWebhookCapabilityReason[] = []
  const capabilities: NotificationWebhookCapabilities = {
    canReadStoredWebhook: true,
    canSaveWebhook: hasValidEncryptionKey(),
    reasons,
  }

  if (!capabilities.canSaveWebhook) {
    reasons.push('ENCRYPTION_KEY_UNAVAILABLE')
  }

  if (identity.isMockSession) {
    reasons.push('MOCK_SESSION_LOCAL_ONLY')
    capabilities.canReadStoredWebhook = false
    capabilities.canSaveWebhook = false

    return {
      slackWebhook: buildSecretState(null),
      capabilities,
    }
  }

  if (!hasAdminSupabaseEnv()) {
    reasons.push('ADMIN_ENV_UNAVAILABLE')
    capabilities.canReadStoredWebhook = false
    capabilities.canSaveWebhook = false

    return {
      slackWebhook: buildSecretState(null),
      capabilities,
    }
  }

  let userResolution: ResolvedUser

  try {
    userResolution = await resolveUserIdByEmail(identity.email)
  } catch {
    reasons.push('ADMIN_CLIENT_UNAVAILABLE')
    capabilities.canReadStoredWebhook = false
    capabilities.canSaveWebhook = false

    return {
      slackWebhook: buildSecretState(null),
      capabilities,
    }
  }

  if (userResolution.reason || userResolution.userId === null) {
    reasons.push(userResolution.reason ?? 'USER_ROW_NOT_FOUND')
    capabilities.canReadStoredWebhook = false
    capabilities.canSaveWebhook = false

    return {
      slackWebhook: buildSecretState(null),
      capabilities,
    }
  }

  let settingsResolution: ResolvedNotificationSettings

  try {
    settingsResolution = await resolveNotificationSettingsByUserId(userResolution.userId)
  } catch {
    reasons.push('ADMIN_CLIENT_UNAVAILABLE')
    capabilities.canReadStoredWebhook = false
    capabilities.canSaveWebhook = false

    return {
      slackWebhook: buildSecretState(null),
      capabilities,
    }
  }

  if (settingsResolution.reason) {
    reasons.push(settingsResolution.reason)
    capabilities.canReadStoredWebhook = false
    capabilities.canSaveWebhook = false

    return {
      slackWebhook: buildSecretState(null),
      capabilities,
    }
  }

  return {
    slackWebhook: buildSecretState(settingsResolution.row?.encrypted_slack_webhook ?? null),
    capabilities,
  }
}

export async function updateSlackWebhook(
  identity: NotificationSettingsIdentity,
  slackWebhook: string,
): Promise<NotificationSecretState> {
  if (identity.isMockSession) {
    throw new NotificationSettingsServiceError(
      403,
      'Slack webhook save is unavailable in mock session',
    )
  }

  if (!hasAdminSupabaseEnv()) {
    throw new NotificationSettingsServiceError(
      503,
      'Slack webhook storage is unavailable: missing admin Supabase environment',
    )
  }

  validateSlackWebhook(slackWebhook)

  const key = requireEncryptionKey()
  const userResolution = await resolveUserIdByEmail(identity.email)

  if (userResolution.reason === 'USER_ROW_NOT_FOUND') {
    throw new NotificationSettingsServiceError(
      409,
      'Cannot save Slack webhook: no users row found for this account',
    )
  }

  if (userResolution.reason === 'MULTIPLE_USER_ROWS') {
    throw new NotificationSettingsServiceError(
      409,
      'Cannot save Slack webhook: multiple users rows match this account',
    )
  }

  if (userResolution.userId === null) {
    throw new NotificationSettingsServiceError(409, 'Cannot save Slack webhook for this account')
  }

  const settingsResolution = await resolveNotificationSettingsByUserId(userResolution.userId)

  if (settingsResolution.reason === 'MULTIPLE_NOTIFICATION_SETTINGS') {
    throw new NotificationSettingsServiceError(
      409,
      'Cannot save Slack webhook: multiple notification settings rows exist for this user',
    )
  }

  const supabase = createAdminSupabaseClient()
  const encryptedSlackWebhook = encryptToString(slackWebhook, key)
  const nextValues = {
    user_id: userResolution.userId,
    encrypted_slack_webhook: encryptedSlackWebhook,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = settingsResolution.row
    ? await supabase
        .from('notification_settings')
        .update(nextValues)
        .eq('id', settingsResolution.row.id)
        .select('id, user_id, encrypted_slack_webhook, updated_at')
        .maybeSingle()
    : await supabase
        .from('notification_settings')
        .insert(nextValues)
        .select('id, user_id, encrypted_slack_webhook, updated_at')
        .maybeSingle()

  if (error || !data) {
    throw new NotificationSettingsServiceError(
      503,
      'Slack webhook storage is temporarily unavailable',
    )
  }

  return buildSecretState(data.encrypted_slack_webhook)
}
