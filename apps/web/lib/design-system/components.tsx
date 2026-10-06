// == KALKI ENTERPRISE COMPONENT LIBRARY ==
// Industry-standard interactive components with full state management
// -----------------------------------------------------------------------------

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, InputHTMLAttributes, forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';

/**
 * Enterprise Button - Full state support, accessible, WCAG compliant
 */
export interface EnterpriseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'base' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  asChild?: boolean;
}

export const EnterpriseButton = forwardRef<HTMLButtonElement, EnterpriseButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'base',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      asChild = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variantClasses = {
      primary:
        'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-glow hover:shadow-glow-lg',
      secondary:
        'bg-purple-600 hover:bg-purple-700 text-white',
      outline:
        'border border-white/20 hover:border-cyan-500/40 bg-transparent hover:bg-white/5 text-white',
      ghost:
        'bg-transparent hover:bg-white/5 text-white/70 hover:text-white',
      destructive:
        'bg-red-600 hover:bg-red-700 text-white',
    };

    const sizeClasses = {
      sm: 'h-8 px-3 text-sm rounded-lg',
      base: 'h-10 px-4 text-base rounded-xl',
      lg: 'h-12 px-6 text-lg rounded-xl',
    };

    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : icon && iconPosition === 'left' ? (
          icon
        ) : null}
        {children}
        {icon && iconPosition === 'right' && !loading && icon}
      </Comp>
    );
  }
);

EnterpriseButton.displayName = 'EnterpriseButton';

/**
 * Enterprise Input - Accessible form input with validation states
 */
export interface EnterpriseInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'base' | 'lg';
}

export const EnterpriseInput = forwardRef<HTMLInputElement, EnterpriseInputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      size = 'base',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      base: 'h-10 px-4 text-base',
      lg: 'h-12 px-4 text-lg',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-white/70 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-white/5 border rounded-lg transition-all duration-200',
              'text-white placeholder-white/30',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                : 'border-white/10 hover:border-white/20',
              sizeClasses[size],
              icon && 'pl-10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-help`} className="mt-1.5 text-sm text-white/40">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

EnterpriseInput.displayName = 'EnterpriseInput';

/**
 * Badge - Status indicator badge
 */
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'base';
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default',
  size = 'base',
  className 
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-white/10 text-white/70 border-white/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    base: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full border',
      variantClasses[variant],
      sizeClasses[size],
      className
    )}>
      {children}
    </span>
  );
}

/**
 * Divider - Semantic separator
 */
export function Divider({ className }: { className?: string }) {
  return (
    <div className={cn('h-px bg-white/10 my-6', className)} role="separator" />
  );
}

/**
 * Skeleton - Loading placeholder
 */
export function Skeleton({ 
  className,
  variant = 'rectangular'
}: { 
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}) {
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-white/10',
        variantClasses[variant],
        className
      )}
    />
  );
}
