'use client'

import type { HTMLAttributes } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tabs components must be used within Tabs')
  return context
}

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string
}

export function Tabs({ defaultValue, className, ...props }: TabsProps) {
  const [value, setValue] = useState(defaultValue)
  const context = useMemo(() => ({ value, setValue }), [value])

  return (
    <TabsContext.Provider value={context}>
      <div className={cn('space-y-4', className)} {...props} />
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('inline-flex h-10 items-center rounded-md bg-secondary p-1 text-secondary-foreground', className)} {...props} />
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const tabs = useTabsContext()
  const isActive = tabs.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => tabs.setValue(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
        isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ value, className, ...props }: TabsContentProps) {
  const tabs = useTabsContext()
  if (tabs.value !== value) return null
  return <div className={cn('rounded-md border p-4', className)} {...props} />
}
