'use client'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface LuxuryButtonProps extends Omit<HTMLMotionProps<"button">, "children" | "ref"> {
  variant?: ButtonVariant
  size?: ButtonSize
  label: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  loading?: boolean
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40',
  secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-white/20',
  outline: 'bg-transparent text-white border border-white/20 hover:border-white/40 hover:bg-white/5',
  ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  danger: 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/20',
  success: 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/20',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
}

export const LuxuryButton = forwardRef<HTMLButtonElement, LuxuryButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      label,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      loading = false,
      disabled,
      className,
      type = 'button',
      onClick,
      ...props // ← style is included here; we never pass undefined explicitly
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-black',
          'min-w-[120px]',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          isDisabled && 'opacity-50 cursor-not-allowed',
          variant === 'primary' && 'backdrop-blur-sm',
          className
        )}
        {...props} // style is spread here — if undefined, it's omitted
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            <span className="font-medium tracking-wide">{label}</span>
            {icon && iconPosition === 'right' && icon}
          </>
        )}
        <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </motion.button>
    )
  }
)

LuxuryButton.displayName = 'LuxuryButton'
