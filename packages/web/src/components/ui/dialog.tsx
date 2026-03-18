'use client'

import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from 'react'
import { cloneElement, createContext, isValidElement, useContext, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = useContext(DialogContext)
  if (!context) throw new Error('Dialog components must be used within Dialog')
  return context
}

export function Dialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const value = useMemo(() => ({ open, setOpen }), [open])
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
}

interface DialogTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: ReactNode
}

export function DialogTrigger({ asChild, children, ...props }: DialogTriggerProps) {
  const dialog = useDialogContext()

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: () => void }>
    return cloneElement(child, {
      onClick: () => dialog.setOpen(true),
    })
  }

  return (
    <button type="button" onClick={() => dialog.setOpen(true)} {...props}>
      {children}
    </button>
  )
}

export function DialogContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const dialog = useDialogContext()
  if (!dialog.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => dialog.setOpen(false)}>
      <div className={cn('w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl', className)} onClick={(event) => event.stopPropagation()} {...props} />
    </div>
  )
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1.5', className)} {...props} />
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />
}
