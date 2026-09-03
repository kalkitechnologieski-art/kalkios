'use client'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  label?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const LuxuryButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      className,
      children,
      label,
      icon,
      iconPosition = 'left',
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-black font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-200',
      secondary:
        'bg-white/10 hover:bg-white/15 active:bg-white/20 text-white border border-white/10 hover:border-white/20',
      tertiary:
        'text-white/50 hover:text-white/70 active:text-white hover:bg-white/5',
      destructive:
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
    }

    const sizes = {
      sm: 'px-4 py-1.5 text-sm min-h-[36px] min-w-[80px]',
      md: 'px-6 py-2.5 text-base min-h-[44px] min-w-[120px]',
      lg: 'px-8 py-3.5 text-lg min-h-[52px] min-w-[160px]',
    }

    const isDisabled = disabled || loading
    const content = label || children

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-black',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          isDisabled && 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100',
          !isDisabled && 'active:scale-[0.98]',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {content}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </button>
    )
  }
)

LuxuryButton.displayName = 'LuxuryButton'
