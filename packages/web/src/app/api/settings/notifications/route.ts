import type { User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

type NotificationCapabilityReason = 'MOCK_SESSION_LOCAL_ONLY' | 'WEBHOOK_STORAGE_UNAVAILABLE'

interface NotificationPreferences {
  emailEnabled: boolean
  lossLimitPercent: number | null
  slackWebhookConfigured: boolean
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

function getNotificationCapabilities(isMockSession: boolean): NotificationCapabilities {
  return {
    canPatch: true,
    canSaveWebhook: false,
    reasons: isMockSession
      ? ['MOCK_SESSION_LOCAL_ONLY', 'WEBHOOK_STORAGE_UNAVAILABLE']
      : ['WEBHOOK_STORAGE_UNAVAILABLE'],
  }
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
      slackWebhookConfigured: false,
    }
  }

  const rawPreferences = user.user_metadata.notificationPreferences

  if (!isRecord(rawPreferences)) {
    return {
      emailEnabled: true,
      lossLimitPercent: defaultLossLimitPercent,
      slackWebhookConfigured: false,
    }
  }

  return {
    emailEnabled: readBoolean(rawPreferences.emailEnabled, true),
    lossLimitPercent: parseLossLimitPercent(
      rawPreferences.lossLimitPercent,
      defaultLossLimitPercent,
    ),
    slackWebhookConfigured: false,
  }
}

export async function GET(request: NextRequest) {
  try {
    const isMockSession = request.cookies.get('mock_session')?.value === 'active'

    if (isMockSession) {
      const emailEnabled =
        request.cookies.get('mock_notifications_email_enabled')?.value !== 'false'
      const lossLimitPercent = parseLossLimitPercent(
        request.cookies.get('mock_notifications_loss_limit_percent')?.value,
        defaultLossLimitPercent,
      )

      return buildResponse(
        {
          emailEnabled,
          lossLimitPercent,
          slackWebhookConfigured: false,
        },
        getNotificationCapabilities(true),
      )
    }

    if (!hasPublicSupabaseEnv()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return buildResponse(
      getNotificationPreferencesFromMetadata(user),
      getNotificationCapabilities(false),
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
    const validationError = validateLossLimitPercent(lossLimitPercent)

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const isMockSession = request.cookies.get('mock_session')?.value === 'active'

    if (isMockSession) {
      const response = buildResponse(
        {
          emailEnabled,
          lossLimitPercent,
          slackWebhookConfigured: false,
        },
        getNotificationCapabilities(true),
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

    if (!hasPublicSupabaseEnv()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingMetadata = isRecord(user.user_metadata) ? user.user_metadata : {}
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

    return buildResponse(
      {
        emailEnabled,
        lossLimitPercent,
        slackWebhookConfigured: false,
      },
      getNotificationCapabilities(false),
    )
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
