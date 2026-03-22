'use client'

import type { BrokerType } from '@alphix/shared'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ProfileUser {
  email: string
  name: string
  isMockSession: boolean
}

type BrokerCapabilityReason =
  | 'MOCK_SESSION_UNSUPPORTED'
  | 'ADMIN_ENV_UNAVAILABLE'
  | 'ADMIN_CLIENT_UNAVAILABLE'
  | 'ENCRYPTION_KEY_UNAVAILABLE'
  | 'USER_ROW_NOT_FOUND'
  | 'MULTIPLE_USER_ROWS'
  | 'MULTIPLE_BROKER_CONFIGS'
  | 'UNSUPPORTED_STORED_BROKER_TYPE'

interface BrokerSecretState {
  isSet: boolean
  maskedValue: string | null
}

interface BrokerSettingsConfigView {
  id: number
  brokerType: BrokerType
  isActive: boolean
  apiKey: BrokerSecretState
  secret: BrokerSecretState
}

interface BrokerSettingsCapabilities {
  canReadStoredConfig: boolean
  canPatchConfig: boolean
  canSaveSecrets: boolean
  reasons: BrokerCapabilityReason[]
}

interface BrokerSettingsSnapshot {
  supportedBrokers: BrokerType[]
  currentConfig: BrokerSettingsConfigView | null
  capabilities: BrokerSettingsCapabilities
}

type NotificationCapabilityReason = 'MOCK_SESSION_LOCAL_ONLY' | 'WEBHOOK_STORAGE_UNAVAILABLE'

interface NotificationSettingsView {
  emailEnabled: boolean
  lossLimitPercent: number | null
  slackWebhookConfigured: boolean
}

interface NotificationSettingsCapabilities {
  canPatch: boolean
  canSaveWebhook: boolean
  reasons: NotificationCapabilityReason[]
}

interface NotificationSettingsSnapshot {
  settings: NotificationSettingsView
  capabilities: NotificationSettingsCapabilities
}

const brokerTypeValues: BrokerType[] = [
  'kis',
  'kis-overseas',
  'alpaca',
  'kiwoom',
  'binance',
  'upbit',
]

const brokerLabels: Record<BrokerType, string> = {
  kis: 'KIS 국내주식',
  'kis-overseas': 'KIS 해외주식',
  alpaca: 'Alpaca',
  kiwoom: 'Kiwoom',
  binance: 'Binance',
  upbit: 'Upbit',
}

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readErrorMessage(payload: unknown) {
  if (!isRecord(payload) || typeof payload.error !== 'string') {
    return null
  }

  return payload.error
}

function readProfileUser(payload: unknown): ProfileUser | null {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.user)) {
    return null
  }

  const { user } = payload.data

  if (
    typeof user.email !== 'string' ||
    typeof user.name !== 'string' ||
    typeof user.isMockSession !== 'boolean'
  ) {
    return null
  }

  return {
    email: user.email,
    name: user.name,
    isMockSession: user.isMockSession,
  }
}

function isBrokerType(value: unknown): value is BrokerType {
  return typeof value === 'string' && brokerTypeValues.includes(value as BrokerType)
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return null
  }

  return value
}

function readNumberOrNull(value: unknown): number | null {
  if (value === null) {
    return null
  }

  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readBrokerSecretState(value: unknown): BrokerSecretState | null {
  if (!isRecord(value) || typeof value.isSet !== 'boolean') {
    return null
  }

  if (value.maskedValue !== null && typeof value.maskedValue !== 'string') {
    return null
  }

  return {
    isSet: value.isSet,
    maskedValue: value.maskedValue,
  }
}

function readBrokerSettingsConfig(value: unknown): BrokerSettingsConfigView | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.isActive !== 'boolean') {
    return null
  }

  if (!isBrokerType(value.brokerType)) {
    return null
  }

  const apiKey = readBrokerSecretState(value.apiKey)
  const secret = readBrokerSecretState(value.secret)

  if (!apiKey || !secret) {
    return null
  }

  return {
    id: value.id,
    brokerType: value.brokerType,
    isActive: value.isActive,
    apiKey,
    secret,
  }
}

function readBrokerCapabilities(value: unknown): BrokerSettingsCapabilities | null {
  if (
    !isRecord(value) ||
    typeof value.canReadStoredConfig !== 'boolean' ||
    typeof value.canPatchConfig !== 'boolean' ||
    typeof value.canSaveSecrets !== 'boolean'
  ) {
    return null
  }

  const reasons = readStringArray(value.reasons)

  if (!reasons) {
    return null
  }

  return {
    canReadStoredConfig: value.canReadStoredConfig,
    canPatchConfig: value.canPatchConfig,
    canSaveSecrets: value.canSaveSecrets,
    reasons: reasons.filter((reason): reason is BrokerCapabilityReason => {
      return [
        'MOCK_SESSION_UNSUPPORTED',
        'ADMIN_ENV_UNAVAILABLE',
        'ADMIN_CLIENT_UNAVAILABLE',
        'ENCRYPTION_KEY_UNAVAILABLE',
        'USER_ROW_NOT_FOUND',
        'MULTIPLE_USER_ROWS',
        'MULTIPLE_BROKER_CONFIGS',
        'UNSUPPORTED_STORED_BROKER_TYPE',
      ].includes(reason)
    }),
  }
}

function readBrokerSettingsSnapshot(payload: unknown): BrokerSettingsSnapshot | null {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null
  }

  const supportedBrokerValues = readStringArray(payload.data.supportedBrokers)
  const capabilities = readBrokerCapabilities(payload.data.capabilities)

  if (!supportedBrokerValues || !capabilities) {
    return null
  }

  const supportedBrokers = supportedBrokerValues.filter(isBrokerType)

  if (supportedBrokers.length !== supportedBrokerValues.length) {
    return null
  }

  const currentConfig =
    payload.data.currentConfig === null
      ? null
      : readBrokerSettingsConfig(payload.data.currentConfig)

  if (payload.data.currentConfig !== null && !currentConfig) {
    return null
  }

  return {
    supportedBrokers,
    currentConfig,
    capabilities,
  }
}

function readBrokerSettingsConfigFromPatch(payload: unknown): BrokerSettingsConfigView | null {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null
  }

  return readBrokerSettingsConfig(payload.data.config)
}

function readNotificationSettings(payload: unknown): NotificationSettingsSnapshot | null {
  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    !isRecord(payload.data.settings) ||
    !isRecord(payload.data.capabilities)
  ) {
    return null
  }

  if (
    typeof payload.data.settings.emailEnabled !== 'boolean' ||
    typeof payload.data.settings.slackWebhookConfigured !== 'boolean' ||
    typeof payload.data.capabilities.canPatch !== 'boolean' ||
    typeof payload.data.capabilities.canSaveWebhook !== 'boolean'
  ) {
    return null
  }

  const reasons = readStringArray(payload.data.capabilities.reasons)

  if (!reasons) {
    return null
  }

  const lossLimitPercent = readNumberOrNull(payload.data.settings.lossLimitPercent)

  return {
    settings: {
      emailEnabled: payload.data.settings.emailEnabled,
      lossLimitPercent,
      slackWebhookConfigured: payload.data.settings.slackWebhookConfigured,
    },
    capabilities: {
      canPatch: payload.data.capabilities.canPatch,
      canSaveWebhook: payload.data.capabilities.canSaveWebhook,
      reasons: reasons.filter((reason): reason is NotificationCapabilityReason => {
        return ['MOCK_SESSION_LOCAL_ONLY', 'WEBHOOK_STORAGE_UNAVAILABLE'].includes(reason)
      }),
    },
  }
}

function formatBrokerCapabilityReason(reason: BrokerCapabilityReason) {
  switch (reason) {
    case 'MOCK_SESSION_UNSUPPORTED':
      return '로컬 mock 세션에서는 브로커 설정 저장을 지원하지 않습니다.'
    case 'ADMIN_ENV_UNAVAILABLE':
      return '서버 관리자 환경이 준비되지 않아 브로커 설정을 읽거나 저장할 수 없습니다.'
    case 'ADMIN_CLIENT_UNAVAILABLE':
      return '브로커 설정 저장소 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.'
    case 'ENCRYPTION_KEY_UNAVAILABLE':
      return 'ENCRYPTION_KEY가 없어 새 API Key/Secret 저장은 현재 비활성화됩니다.'
    case 'USER_ROW_NOT_FOUND':
      return '이 계정에 연결된 사용자 레코드를 찾지 못해 브로커 설정을 저장할 수 없습니다.'
    case 'MULTIPLE_USER_ROWS':
      return '같은 이메일에 연결된 사용자 레코드가 여러 개라 브로커 설정을 안전하게 수정할 수 없습니다.'
    case 'MULTIPLE_BROKER_CONFIGS':
      return '이 계정에 여러 브로커 설정이 있어 현재 화면에서는 수정할 수 없습니다.'
    case 'UNSUPPORTED_STORED_BROKER_TYPE':
      return '저장된 브로커 유형을 현재 앱에서 지원하지 않습니다.'
  }
}

function formatBrokerSecretState(state: BrokerSecretState) {
  return state.isSet ? (state.maskedValue ?? '********') : '미저장'
}

function formatNotificationCapabilityReason(reason: NotificationCapabilityReason) {
  switch (reason) {
    case 'MOCK_SESSION_LOCAL_ONLY':
      return '로컬 mock 세션에서는 알림 선호도가 현재 브라우저 세션에만 저장됩니다.'
    case 'WEBHOOK_STORAGE_UNAVAILABLE':
      return 'Slack Webhook 같은 비밀 연동값은 아직 안전한 저장소가 없어 이 화면에서 저장하지 않습니다.'
  }
}

function formatLossLimitPercent(value: number | null) {
  return value === null ? '' : String(value)
}

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [savedName, setSavedName] = useState('')
  const [email, setEmail] = useState('')
  const [isMockSession, setIsMockSession] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [supportedBrokers, setSupportedBrokers] = useState<BrokerType[]>([])
  const [brokerConfig, setBrokerConfig] = useState<BrokerSettingsConfigView | null>(null)
  const [brokerCapabilities, setBrokerCapabilities] = useState<BrokerSettingsCapabilities | null>(
    null,
  )
  const [selectedBrokerType, setSelectedBrokerType] = useState<BrokerType | ''>('')
  const [savedBrokerType, setSavedBrokerType] = useState<BrokerType | ''>('')
  const [brokerApiKeyInput, setBrokerApiKeyInput] = useState('')
  const [brokerSecretInput, setBrokerSecretInput] = useState('')
  const [isLoadingBrokerSettings, setIsLoadingBrokerSettings] = useState(true)
  const [isSavingBrokerSettings, setIsSavingBrokerSettings] = useState(false)
  const [brokerError, setBrokerError] = useState<string | null>(null)
  const [brokerMessage, setBrokerMessage] = useState<string | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsView | null>(
    null,
  )
  const [notificationCapabilities, setNotificationCapabilities] =
    useState<NotificationSettingsCapabilities | null>(null)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [savedEmailNotificationsEnabled, setSavedEmailNotificationsEnabled] = useState(true)
  const [lossLimitPercentInput, setLossLimitPercentInput] = useState('')
  const [savedLossLimitPercentInput, setSavedLossLimitPercentInput] = useState('')
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadProfile() {
      setIsLoadingProfile(true)
      setProfileError(null)

      try {
        const response = await fetch('/api/auth/profile', {
          method: 'GET',
          cache: 'no-store',
        })
        const payload: unknown = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(readErrorMessage(payload) ?? '프로필 정보를 불러오지 못했습니다.')
        }

        const user = readProfileUser(payload)

        if (!user) {
          throw new Error('프로필 응답을 해석하지 못했습니다.')
        }

        if (!isActive) {
          return
        }

        setName(user.name)
        setSavedName(user.name)
        setEmail(user.email)
        setIsMockSession(user.isMockSession)
      } catch (error) {
        if (!isActive) {
          return
        }

        setProfileError(
          error instanceof Error ? error.message : '프로필 정보를 불러오는 중 오류가 발생했습니다.',
        )
      } finally {
        if (isActive) {
          setIsLoadingProfile(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadBrokerSettings() {
      setIsLoadingBrokerSettings(true)
      setBrokerError(null)

      try {
        const response = await fetch('/api/settings/broker', {
          method: 'GET',
          cache: 'no-store',
        })
        const payload: unknown = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(readErrorMessage(payload) ?? '브로커 설정을 불러오지 못했습니다.')
        }

        const snapshot = readBrokerSettingsSnapshot(payload)

        if (!snapshot) {
          throw new Error('브로커 설정 응답을 해석하지 못했습니다.')
        }

        if (!isActive) {
          return
        }

        const initialBrokerType =
          snapshot.currentConfig?.brokerType ?? snapshot.supportedBrokers[0] ?? ''

        setSupportedBrokers(snapshot.supportedBrokers)
        setBrokerConfig(snapshot.currentConfig)
        setBrokerCapabilities(snapshot.capabilities)
        setSelectedBrokerType(initialBrokerType)
        setSavedBrokerType(snapshot.currentConfig?.brokerType ?? '')
      } catch (error) {
        if (!isActive) {
          return
        }

        setBrokerError(
          error instanceof Error ? error.message : '브로커 설정을 불러오는 중 오류가 발생했습니다.',
        )
      } finally {
        if (isActive) {
          setIsLoadingBrokerSettings(false)
        }
      }
    }

    void loadBrokerSettings()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadNotificationSettings() {
      setIsLoadingNotifications(true)
      setNotificationError(null)

      try {
        const response = await fetch('/api/settings/notifications', {
          method: 'GET',
          cache: 'no-store',
        })
        const payload: unknown = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(readErrorMessage(payload) ?? '알림 설정을 불러오지 못했습니다.')
        }

        const snapshot = readNotificationSettings(payload)

        if (!snapshot) {
          throw new Error('알림 설정 응답을 해석하지 못했습니다.')
        }

        if (!isActive) {
          return
        }

        const initialLossLimit = formatLossLimitPercent(snapshot.settings.lossLimitPercent)

        setNotificationSettings(snapshot.settings)
        setNotificationCapabilities(snapshot.capabilities)
        setEmailNotificationsEnabled(snapshot.settings.emailEnabled)
        setSavedEmailNotificationsEnabled(snapshot.settings.emailEnabled)
        setLossLimitPercentInput(initialLossLimit)
        setSavedLossLimitPercentInput(initialLossLimit)
      } catch (error) {
        if (!isActive) {
          return
        }

        setNotificationError(
          error instanceof Error ? error.message : '알림 설정을 불러오는 중 오류가 발생했습니다.',
        )
      } finally {
        if (isActive) {
          setIsLoadingNotifications(false)
        }
      }
    }

    void loadNotificationSettings()

    return () => {
      isActive = false
    }
  }, [])

  const hasProfileChanges = name.trim() !== savedName
  const hasBrokerSecretInputs = brokerApiKeyInput.trim() !== '' || brokerSecretInput.trim() !== ''
  const hasBrokerChanges = brokerConfig
    ? selectedBrokerType !== savedBrokerType || hasBrokerSecretInputs
    : Boolean(selectedBrokerType) || hasBrokerSecretInputs
  const hasNotificationChanges =
    emailNotificationsEnabled !== savedEmailNotificationsEnabled ||
    lossLimitPercentInput.trim() !== savedLossLimitPercentInput.trim()

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileError(null)
    setProfileMessage(null)
    setIsSavingProfile(true)

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })
      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(readErrorMessage(payload) ?? '프로필 저장에 실패했습니다.')
      }

      const user = readProfileUser(payload)

      if (!user) {
        throw new Error('프로필 저장 응답을 해석하지 못했습니다.')
      }

      setName(user.name)
      setSavedName(user.name)
      setEmail(user.email)
      setIsMockSession(user.isMockSession)
      setProfileMessage('프로필이 저장되었습니다.')
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : '프로필 저장 중 오류가 발생했습니다.',
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleBrokerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedBrokerType) {
      setBrokerError('저장할 브로커를 선택해 주세요.')
      return
    }

    setBrokerError(null)
    setBrokerMessage(null)
    setIsSavingBrokerSettings(true)

    try {
      const payload: Record<string, unknown> = {
        brokerType: selectedBrokerType,
      }

      if (brokerApiKeyInput.trim()) {
        payload.apiKey = brokerApiKeyInput.trim()
      }

      if (brokerSecretInput.trim()) {
        payload.secret = brokerSecretInput.trim()
      }

      const response = await fetch('/api/settings/broker', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const result: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(readErrorMessage(result) ?? '브로커 설정 저장에 실패했습니다.')
      }

      const config = readBrokerSettingsConfigFromPatch(result)

      if (!config) {
        throw new Error('브로커 설정 저장 응답을 해석하지 못했습니다.')
      }

      setBrokerConfig(config)
      setSelectedBrokerType(config.brokerType)
      setSavedBrokerType(config.brokerType)
      setBrokerApiKeyInput('')
      setBrokerSecretInput('')
      setBrokerMessage('브로커 설정이 저장되었습니다.')
    } catch (error) {
      setBrokerError(
        error instanceof Error ? error.message : '브로커 설정 저장 중 오류가 발생했습니다.',
      )
    } finally {
      setIsSavingBrokerSettings(false)
    }
  }

  async function handleNotificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotificationError(null)
    setNotificationMessage(null)
    setIsSavingNotifications(true)

    try {
      const normalizedLossLimit = lossLimitPercentInput.trim()
      const payload = {
        emailEnabled: emailNotificationsEnabled,
        lossLimitPercent: normalizedLossLimit ? Number(normalizedLossLimit) : null,
      }

      const response = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const result: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(readErrorMessage(result) ?? '알림 설정 저장에 실패했습니다.')
      }

      const snapshot = readNotificationSettings(result)

      if (!snapshot) {
        throw new Error('알림 설정 저장 응답을 해석하지 못했습니다.')
      }

      const nextLossLimit = formatLossLimitPercent(snapshot.settings.lossLimitPercent)

      setNotificationSettings(snapshot.settings)
      setNotificationCapabilities(snapshot.capabilities)
      setEmailNotificationsEnabled(snapshot.settings.emailEnabled)
      setSavedEmailNotificationsEnabled(snapshot.settings.emailEnabled)
      setLossLimitPercentInput(nextLossLimit)
      setSavedLossLimitPercentInput(nextLossLimit)
      setNotificationMessage('알림 설정이 저장되었습니다.')
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : '알림 설정 저장 중 오류가 발생했습니다.',
      )
    } finally {
      setIsSavingNotifications(false)
    }
  }

  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList>
        <TabsTrigger value="profile">프로필</TabsTrigger>
        <TabsTrigger value="broker">브로커</TabsTrigger>
        <TabsTrigger value="notifications">알림</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">프로필 설정</h2>
          <p className="text-sm text-muted-foreground">
            현재 로그인한 계정 정보를 확인하고 이름을 업데이트합니다.
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-2">
            <label htmlFor="settings-name" className="text-sm font-medium">
              이름
            </label>
            <Input
              id="settings-name"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isLoadingProfile || isSavingProfile}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="settings-email" className="text-sm font-medium">
              이메일
            </label>
            <Input
              id="settings-email"
              value={email}
              readOnly
              disabled={isLoadingProfile}
              className="text-muted-foreground"
            />
          </div>

          {isLoadingProfile ? (
            <p className="text-sm text-muted-foreground">프로필 정보를 불러오는 중입니다.</p>
          ) : null}

          {profileError ? (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {profileError}
            </p>
          ) : null}

          {profileMessage ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {profileMessage}
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground">
            {isMockSession
              ? '로컬 mock 세션에서는 이름 변경이 현재 로그인 세션에 저장됩니다.'
              : '이메일은 인증 공급자 기준으로 관리되며, 이름만 이 화면에서 수정할 수 있습니다.'}
          </p>

          <Button
            type="submit"
            disabled={isLoadingProfile || isSavingProfile || !hasProfileChanges}
          >
            {isSavingProfile ? '저장 중...' : hasProfileChanges ? '프로필 저장' : '변경 사항 없음'}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="broker" className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">브로커 연결</h2>
          <p className="text-sm text-muted-foreground">
            브로커 유형과 API 자격 증명을 저장합니다. 저장된 비밀값은 항상 마스킹 상태로만
            표시됩니다.
          </p>
        </div>

        <form onSubmit={handleBrokerSubmit} className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-2">
            <label htmlFor="settings-broker-type" className="text-sm font-medium">
              브로커
            </label>
            <select
              id="settings-broker-type"
              className={selectClassName}
              value={selectedBrokerType}
              onChange={(event) => {
                const nextValue = event.target.value
                setSelectedBrokerType(isBrokerType(nextValue) ? nextValue : '')
              }}
              disabled={
                isLoadingBrokerSettings ||
                isSavingBrokerSettings ||
                !brokerCapabilities?.canPatchConfig
              }
            >
              {supportedBrokers.map((brokerType) => (
                <option key={brokerType} value={brokerType}>
                  {brokerLabels[brokerType]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="settings-broker-api-key" className="text-sm font-medium">
                API Key
              </label>
              <Input
                id="settings-broker-api-key"
                type="password"
                placeholder={
                  brokerCapabilities?.canSaveSecrets
                    ? '새 API Key 입력'
                    : '비밀값 저장이 현재 비활성화되어 있습니다'
                }
                value={brokerApiKeyInput}
                onChange={(event) => setBrokerApiKeyInput(event.target.value)}
                disabled={
                  isLoadingBrokerSettings ||
                  isSavingBrokerSettings ||
                  !brokerCapabilities?.canPatchConfig ||
                  !brokerCapabilities?.canSaveSecrets
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-broker-secret" className="text-sm font-medium">
                API Secret
              </label>
              <Input
                id="settings-broker-secret"
                type="password"
                placeholder={
                  brokerCapabilities?.canSaveSecrets
                    ? '새 API Secret 입력'
                    : '비밀값 저장이 현재 비활성화되어 있습니다'
                }
                value={brokerSecretInput}
                onChange={(event) => setBrokerSecretInput(event.target.value)}
                disabled={
                  isLoadingBrokerSettings ||
                  isSavingBrokerSettings ||
                  !brokerCapabilities?.canPatchConfig ||
                  !brokerCapabilities?.canSaveSecrets
                }
              />
            </div>
          </div>

          <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
            <p>
              저장된 브로커: {brokerConfig ? brokerLabels[brokerConfig.brokerType] : '아직 없음'}
            </p>
            <p>
              저장된 API Key:{' '}
              {brokerConfig ? formatBrokerSecretState(brokerConfig.apiKey) : '미저장'}
            </p>
            <p>
              저장된 API Secret:{' '}
              {brokerConfig ? formatBrokerSecretState(brokerConfig.secret) : '미저장'}
            </p>
          </div>

          {isLoadingBrokerSettings ? (
            <p className="text-sm text-muted-foreground">브로커 설정을 불러오는 중입니다.</p>
          ) : null}

          {brokerError ? (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {brokerError}
            </p>
          ) : null}

          {brokerMessage ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {brokerMessage}
            </p>
          ) : null}

          {brokerCapabilities?.reasons.length ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-700">
              {brokerCapabilities.reasons.map((reason) => (
                <p key={reason}>{formatBrokerCapabilityReason(reason)}</p>
              ))}
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            저장 후에는 입력한 비밀값을 다시 보여주지 않고, 다음 조회부터는 마스킹된 상태만
            표시합니다.
          </p>

          <Button
            type="submit"
            disabled={
              isLoadingBrokerSettings ||
              isSavingBrokerSettings ||
              !brokerCapabilities?.canPatchConfig ||
              !hasBrokerChanges ||
              !selectedBrokerType
            }
          >
            {isSavingBrokerSettings ? '저장 중...' : '브로커 설정 저장'}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">알림 설정</h2>
          <p className="text-sm text-muted-foreground">
            비밀값이 필요 없는 알림 선호도는 지금 저장할 수 있고, Webhook 연동은 안전한 저장소를
            준비한 뒤 이어집니다.
          </p>
        </div>

        <form
          onSubmit={handleNotificationSubmit}
          className="space-y-4 rounded-xl border bg-card p-4"
        >
          <div className="space-y-2">
            <label htmlFor="settings-notification-email" className="text-sm font-medium">
              수신 이메일
            </label>
            <Input
              id="settings-notification-email"
              value={email}
              readOnly
              className="text-muted-foreground"
            />
          </div>

          <label className="flex items-center gap-3 rounded-md border px-3 py-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={emailNotificationsEnabled}
              onChange={(event) => setEmailNotificationsEnabled(event.target.checked)}
              disabled={
                isLoadingNotifications ||
                isSavingNotifications ||
                !notificationCapabilities?.canPatch
              }
            />
            <span>이메일 알림 받기</span>
          </label>

          <div className="space-y-2">
            <label htmlFor="settings-loss-limit" className="text-sm font-medium">
              손실 한도 알림 (%)
            </label>
            <Input
              id="settings-loss-limit"
              type="number"
              step="0.1"
              placeholder="예: -3"
              value={lossLimitPercentInput}
              onChange={(event) => setLossLimitPercentInput(event.target.value)}
              disabled={
                isLoadingNotifications ||
                isSavingNotifications ||
                !notificationCapabilities?.canPatch
              }
            />
            <p className="text-xs text-muted-foreground">
              비워두면 손실 한도 알림을 끕니다. 값을 입력할 때는 `-3`처럼 음수 퍼센트로 저장합니다.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="settings-slack-webhook" className="text-sm font-medium">
              Slack Webhook
            </label>
            <Input
              id="settings-slack-webhook"
              type="password"
              placeholder="안전한 비밀값 저장소 준비 후 지원 예정"
              disabled
            />
          </div>

          <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
            <p>이메일 알림: {notificationSettings?.emailEnabled ? '활성화' : '비활성화'}</p>
            <p>
              저장된 손실 한도:{' '}
              {notificationSettings && notificationSettings.lossLimitPercent !== null
                ? `${notificationSettings.lossLimitPercent}%`
                : '미설정'}
            </p>
            <p>
              Slack Webhook 저장 상태:{' '}
              {notificationSettings?.slackWebhookConfigured ? '설정됨' : '미지원'}
            </p>
          </div>

          {isLoadingNotifications ? (
            <p className="text-sm text-muted-foreground">알림 설정을 불러오는 중입니다.</p>
          ) : null}

          {notificationError ? (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {notificationError}
            </p>
          ) : null}

          {notificationMessage ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {notificationMessage}
            </p>
          ) : null}

          {notificationCapabilities?.reasons.length ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-700">
              {notificationCapabilities.reasons.map((reason) => (
                <p key={reason}>{formatNotificationCapabilityReason(reason)}</p>
              ))}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={
              isLoadingNotifications ||
              isSavingNotifications ||
              !notificationCapabilities?.canPatch ||
              !hasNotificationChanges
            }
          >
            {isSavingNotifications
              ? '저장 중...'
              : hasNotificationChanges
                ? '알림 설정 저장'
                : '변경 사항 없음'}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  )
}
