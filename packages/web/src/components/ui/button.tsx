import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'
import { cloneElement, isValidElement } from 'react'

import { cn } from '@/lib/utils'

type ButtonVariant = 'default' | 'outline' | 'ghost'
type ButtonSize = 'default' | 'sm' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:opacity-90',
  outline: 'border border-border bg-background hover:bg-secondary',
  ghost: 'hover:bg-secondary',
}

const sizeClass: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-9 px-3 text-sm',
  lg: 'h-11 px-6 text-base',
}

const baseClass =
  'inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'

export function Button({ asChild, className, variant = 'default', size = 'default', children, ...props }: ButtonProps) {
  const mergedClassName = cn(baseClass, variantClass[variant], sizeClass[size], className)

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>
    return cloneElement(child, {
      className: cn(mergedClassName, child.props.className),
    })
  }

  return (
    <button className={mergedClassName} {...props}>
      {children}
    </button>
  )
}
