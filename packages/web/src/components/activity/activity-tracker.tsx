'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface ActivityTrackerProps {
  userKey: string
  isAdmin: boolean
}

type ActivityType = 'page_view' | 'click' | 'submit' | 'input'

interface ActivityLogItem {
  type: ActivityType
  path: string
  target: string
  at: string
}

interface ActivitySnapshot {
  logs: ActivityLogItem[]
  lastPath: string
  drafts: Record<string, string>
  updatedAt: string
}

const LOG_LIMIT = 500

function storageKeyFor(userKey: string) {
  return `alphix.activity.${userKey}`
}

function restoreFlagKeyFor(userKey: string) {
  return `alphix.activity.restored.${userKey}`
}

function safeLocalStorageGet(key: string) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeLocalStorageSet(key: string, value: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, value)
  } catch {}
}

function safeSessionStorageGet(key: string) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSessionStorageSet(key: string, value: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(key, value)
  } catch {}
}

function readSnapshot(userKey: string): ActivitySnapshot {
  if (typeof window === 'undefined') {
    return { logs: [], lastPath: '/dashboard', drafts: {}, updatedAt: new Date().toISOString() }
  }

  const raw = safeLocalStorageGet(storageKeyFor(userKey))
  if (!raw) {
    return { logs: [], lastPath: '/dashboard', drafts: {}, updatedAt: new Date().toISOString() }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ActivitySnapshot>
    return {
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      lastPath: typeof parsed.lastPath === 'string' ? parsed.lastPath : '/dashboard',
      drafts: parsed.drafts && typeof parsed.drafts === 'object' ? parsed.drafts : {},
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    return { logs: [], lastPath: '/dashboard', drafts: {}, updatedAt: new Date().toISOString() }
  }
}

function writeSnapshot(userKey: string, snapshot: ActivitySnapshot) {
  if (typeof window === 'undefined') {
    return
  }

  safeLocalStorageSet(storageKeyFor(userKey), JSON.stringify(snapshot))
}

function pushLog(userKey: string, item: ActivityLogItem) {
  const snapshot = readSnapshot(userKey)
  const nextLogs = [item, ...snapshot.logs].slice(0, LOG_LIMIT)
  writeSnapshot(userKey, {
    ...snapshot,
    logs: nextLogs,
    updatedAt: item.at,
  })
}

function updateDraft(userKey: string, fieldKey: string, value: string) {
  const snapshot = readSnapshot(userKey)
  writeSnapshot(userKey, {
    ...snapshot,
    drafts: {
      ...snapshot.drafts,
      [fieldKey]: value,
    },
    updatedAt: new Date().toISOString(),
  })
}

function setLastPath(userKey: string, pathname: string) {
  const snapshot = readSnapshot(userKey)
  writeSnapshot(userKey, {
    ...snapshot,
    lastPath: pathname,
    updatedAt: new Date().toISOString(),
  })
}

function applyDrafts(userKey: string, pathname: string) {
  const snapshot = readSnapshot(userKey)
  const entries = Object.entries(snapshot.drafts).filter(([key]) => key.startsWith(`${pathname}::`))

  entries.forEach(([fieldKey, value]) => {
    const id = fieldKey.split('::')[1]
    const target = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null
    if (!target) {
      return
    }

    if ('value' in target && !target.value) {
      target.value = value
    }
  })
}

function safeTargetLabel(element: EventTarget | null) {
  const target = element as HTMLElement | null
  if (!target) {
    return 'unknown'
  }

  return target.getAttribute('id') || target.getAttribute('name') || target.tagName.toLowerCase()
}

export function ActivityTracker({ userKey, isAdmin }: ActivityTrackerProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!pathname || !userKey) {
      return
    }

    applyDrafts(userKey, pathname)
    void fetch('/api/runtime/execution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userKey, action: 'ensure' }),
    })
    setLastPath(userKey, pathname)
    pushLog(userKey, {
      type: 'page_view',
      path: pathname,
      target: pathname,
      at: new Date().toISOString(),
    })

    const restoreFlag = safeSessionStorageGet(restoreFlagKeyFor(userKey))
    const snapshot = readSnapshot(userKey)
    const shouldRestore = !restoreFlag

    if (shouldRestore && snapshot.lastPath && snapshot.lastPath !== pathname) {
      const adminPath = snapshot.lastPath.startsWith('/admin')
      if (!adminPath || isAdmin) {
        safeSessionStorageSet(restoreFlagKeyFor(userKey), '1')
        router.replace(snapshot.lastPath)
      } else {
        safeSessionStorageSet(restoreFlagKeyFor(userKey), '1')
      }
    }

    const onClick = (event: MouseEvent) => {
      pushLog(userKey, {
        type: 'click',
        path: pathname,
        target: safeTargetLabel(event.target),
        at: new Date().toISOString(),
      })
    }

    const onSubmit = (event: Event) => {
      pushLog(userKey, {
        type: 'submit',
        path: pathname,
        target: safeTargetLabel(event.target),
        at: new Date().toISOString(),
      })
    }

    const onInput = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | null
      if (!target || !('value' in target)) {
        return
      }

      const fieldId = target.id || target.name
      if (!fieldId) {
        return
      }

      updateDraft(userKey, `${pathname}::${fieldId}`, target.value)
      pushLog(userKey, {
        type: 'input',
        path: pathname,
        target: fieldId,
        at: new Date().toISOString(),
      })
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetch('/api/runtime/execution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userKey, action: 'ensure' }),
        })
      }
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('submit', onSubmit, true)
    document.addEventListener('input', onInput, true)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('submit', onSubmit, true)
      document.removeEventListener('input', onInput, true)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [isAdmin, pathname, router, userKey])

  return null
}
