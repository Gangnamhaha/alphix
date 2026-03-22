import type { User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { isLocalAuthHost } from '@/lib/auth/mock-auth'
import {
  getNotificationWebhookSnapshot,
  NotificationSettingsServiceError,
  updateSlackWebhook,
} from '@/lib/settings/notification-settings'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type NotificationCapabilityReason =
  | 'MOCK_SESSION_LOCAL_ONLY'
  | 'ADMIN_ENV_UNAVAILABLE'
  | 'ADMIN_CLIENT_UNAVAILABLE'
  | 'ENCRYPTION_KEY_UNAVAILABLE'
  | 'USER_ROW_NOT_FOUND'
  | 'MULTIPLE_USER_ROWS'
  | 'MULTIPLE_NOTIFICATION_SETTINGS'

interface NotificationSecretState {
  isSet: boolean
  maskedValue: string | null
}

interface NotificationPreferences {
  emailEnabled: boolean
  lossLimitPercent: number | null
  slackWebhook: NotificationSecretState
}

interface NotificationCapabilities {
  canPatch: boolean
  canSaveWebhook: boolean
  reasons: NotificationCapabilityReason[]
}

const mockCookieMaxAge = 60 * 60 * 24
const defaultLossLimitPercent = -3

function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function parseLossLimitPercent(value: unknown, fallback: number | null) {
  if (value === null || value === '') {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) {
      return null
    }

    const parsed = Number(trimmed)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function validateLossLimitPercent(value: number | null) {
  if (value === null) {
    return null
  }

  if (value >= 0 || value < -100) {
    return 'Loss limit alert must be between -100 and -0.01 percent'
  }

  return null
}

function buildResponse(settings: NotificationPreferences, capabilities: NotificationCapabilities) {
  return NextResponse.json({
    success: true,
    data: {
      settings,
      capabilities,
    },
  })
}

function getNotificationPreferencesFromMetadata(user: User): NotificationPreferences {
  if (!isRecord(user.user_metadata)) {
    return {
      emailEnabled: true,
      lossLimitPercent: defaultLossLimitPercent,
      slackWebhook: {
        isSet: false,
        maskedValue: null,
      },
    }
  }

  const rawPreferences = user.user_metadata.notificationPreferences

  if (!isRecord(rawPreferences)) {
    return {
      emailEnabled: true,
      lossLimitPercent: defaultLossLimitPercent,
      slackWebhook: {
        isSet: false,
        maskedValue: null,
      },
    }
  }

  return {
    emailEnabled: readBoolean(rawPreferences.emailEnabled, true),
    lossLimitPercent: parseLossLimitPercent(
      rawPreferences.lossLimitPercent,
      defaultLossLimitPercent,
    ),
    slackWebhook: {
      isSet: false,
      maskedValue: null,
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    const isMockSession =
      isLocalAuthHost(host) && request.cookies.get('mock_session')?.value === 'active'

    if (!hasPublicSupabaseEnv()) {
      if (isMockSession) {
        const emailEnabled =
          request.cookies.get('mock_notifications_email_enabled')?.value !== 'false'
        const lossLimitPercent = parseLossLimitPercent(
          request.cookies.get('mock_notifications_loss_limit_percent')?.value,
          defaultLossLimitPercent,
        )
        const webhookSnapshot = await getNotificationWebhookSnapshot({
          email: request.cookies.get('mock_email')?.value ?? 'mock.user@alphix.kr',
          isMockSession: true,
        })

        return buildResponse(
          {
            emailEnabled,
            lossLimitPercent,
            slackWebhook: webhookSnapshot.slackWebhook,
          },
          {
            canPatch: true,
            canSaveWebhook: webhookSnapshot.capabilities.canSaveWebhook,
            reasons: webhookSnapshot.capabilities.reasons,
          },
        )
      }

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      if (isMockSession) {
        const emailEnabled =
          request.cookies.get('mock_notifications_email_enabled')?.value !== 'false'
        const lossLimitPercent = parseLossLimitPercent(
          request.cookies.get('mock_notifications_loss_limit_percent')?.value,
          defaultLossLimitPercent,
        )
        const webhookSnapshot = await getNotificationWebhookSnapshot({
          email: request.cookies.get('mock_email')?.value ?? 'mock.user@alphix.kr',
          isMockSession: true,
        })

        return buildResponse(
          {
            emailEnabled,
            lossLimitPercent,
            slackWebhook: webhookSnapshot.slackWebhook,
          },
          {
            canPatch: true,
            canSaveWebhook: webhookSnapshot.capabilities.canSaveWebhook,
            reasons: webhookSnapshot.capabilities.reasons,
          },
        )
      }

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metadataPreferences = getNotificationPreferencesFromMetadata(user)
    const webhookSnapshot = await getNotificationWebhookSnapshot({
      email: user.email,
      isMockSession: false,
    })

    return buildResponse(
      {
        ...metadataPreferences,
        slackWebhook: webhookSnapshot.slackWebhook,
      },
      {
        canPatch: true,
        canSaveWebhook: webhookSnapshot.capabilities.canSaveWebhook,
        reasons: webhookSnapshot.capabilities.reasons,
      },
    )
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    if (!isRecord(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const emailEnabled = readBoolean(body.emailEnabled, true)
    const lossLimitPercent = parseLossLimitPercent(body.lossLimitPercent, defaultLossLimitPercent)
    const slackWebhook =
      typeof body.slackWebhook === 'string' ? body.slackWebhook.trim() : undefined
    const validationError = validateLossLimitPercent(lossLimitPercent)

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    const isMockSession =
      isLocalAuthHost(host) && request.cookies.get('mock_session')?.value === 'active'

    if (!hasPublicSupabaseEnv()) {
      if (isMockSession) {
        if (slackWebhook) {
          return NextResponse.json(
            { error: 'Slack webhook save is unavailable in mock session' },
            { status: 403 },
          )
        }

        const webhookSnapshot = await getNotificationWebhookSnapshot({
          email: request.cookies.get('mock_email')?.value ?? 'mock.user@alphix.kr',
          isMockSession: true,
        })

        const response = buildResponse(
          {
            emailEnabled,
            lossLimitPercent,
            slackWebhook: webhookSnapshot.slackWebhook,
          },
          {
            canPatch: true,
            canSaveWebhook: webhookSnapshot.capabilities.canSaveWebhook,
            reasons: webhookSnapshot.capabilities.reasons,
          },
        )

        response.cookies.set('mock_notifications_email_enabled', String(emailEnabled), {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: mockCookieMaxAge,
        })

        response.cookies.set(
          'mock_notifications_loss_limit_percent',
          lossLimitPercent === null ? '' : String(lossLimitPercent),
          {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: mockCookieMaxAge,
          },
        )

        return response
      }

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      if (isMockSession) {
        if (slackWebhook) {
          return NextResponse.json(
            { error: 'Slack webhook save is unavailable in mock session' },
            { status: 403 },
          )
        }

        const webhookSnapshot = await getNotificationWebhookSnapshot({
          email: request.cookies.get('mock_email')?.value ?? 'mock.user@alphix.kr',
          isMockSession: true,
        })

        const response = buildResponse(
          {
            emailEnabled,
            lossLimitPercent,
            slackWebhook: webhookSnapshot.slackWebhook,
          },
          {
            canPatch: true,
            canSaveWebhook: webhookSnapshot.capabilities.canSaveWebhook,
            reasons: webhookSnapshot.capabilities.reasons,
          },
        )

        response.cookies.set('mock_notifications_email_enabled', String(emailEnabled), {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: mockCookieMaxAge,
        })

        response.cookies.set(
          'mock_notifications_loss_limit_percent',
          lossLimitPercent === null ? '' : String(lossLimitPercent),
          {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: mockCookieMaxAge,
          },
        )

        return response
      }

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingMetadata = isRecord(user.user_metadata) ? user.user_metadata : {}

    if (slackWebhook) {
      await updateSlackWebhook(
        {
          email: user.email,
          isMockSession: false,
        },
        slackWebhook,
      )
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        ...existingMetadata,
        notificationPreferences: {
          emailEnabled,
          lossLimitPercent,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const webhookSnapshot = await getNotificationWebhookSnapshot({
      email: user.email,
      isMockSession: false,
    })

    return buildResponse(
      {
        emailEnabled,
        lossLimitPercent,
        slackWebhook: webhookSnapshot.slackWebhook,
      },
      {
        canPatch: true,
        canSaveWebhook: webhookSnapshot.capabilities.canSaveWebhook,
        reasons: webhookSnapshot.capabilities.reasons,
      },
    )
  } catch (error) {
    if (error instanceof NotificationSettingsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
