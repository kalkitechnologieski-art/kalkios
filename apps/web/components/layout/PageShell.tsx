// == KALKI ENTERPRISE LAYOUT SYSTEM ==
// Reusable layout primitives for consistent, industry-grade pages
// -----------------------------------------------------------------------------

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

/**
 * PageShell - Standard page wrapper with proper spacing and constraints
 */
export interface PageShellProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  padded?: boolean;
}

export function PageShell({ 
  children, 
  className, 
  fullWidth = false,
  padded = true 
}: PageShellProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-black',
        padded && 'px-4 sm:px-6 lg:px-8',
        !fullWidth && 'max-w-7xl mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Section - Content section with consistent spacing
 */
export interface SectionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'alt' | 'accent';
  spacing?: 'sm' | 'base' | 'lg' | 'xl';
}

export function Section({ 
  children, 
  className,
  variant = 'default',
  spacing = 'lg'
}: SectionProps) {
  const spacingClasses = {
    sm: 'py-8',
    base: 'py-12',
    lg: 'py-16',
    xl: 'py-24',
  };

  const variantClasses = {
    default: 'bg-transparent',
    alt: 'bg-white/[0.02]',
    accent: 'bg-gradient-to-b from-cyan-500/5 to-purple-500/5',
  };

  return (
    <section className={cn(
      spacingClasses[spacing],
      variantClasses[variant],
      className
    )}>
      {children}
    </section>
  );
}

/**
 * Container - Constrained width container
 */
export interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Container({ 
  children, 
  className,
  size = 'lg'
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1600px]',
    full: 'max-w-none',
  };

  return (
    <div className={cn(sizeClasses[size], 'mx-auto px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}

/**
 * Grid - Responsive grid system
 */
export interface GridProps {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'base' | 'lg';
}

export function Grid({ 
  children, 
  className,
  columns = 3,
  gap = 'base'
}: GridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  };

  const gapClasses = {
    sm: 'gap-4',
    base: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div className={cn(
      'grid',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Stack - Vertical spacing utility
 */
export interface StackProps {
  children: ReactNode;
  className?: string;
  spacing?: 'sm' | 'base' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export function Stack({ 
  children, 
  className,
  spacing = 'base',
  align = 'stretch'
}: StackProps) {
  const spacingClasses = {
    sm: 'space-y-4',
    base: 'space-y-6',
    lg: 'space-y-8',
    xl: 'space-y-12',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div className={cn(
      'flex flex-col',
      spacingClasses[spacing],
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Card - Enterprise card component
 */
export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'sm' | 'base' | 'lg';
  hoverable?: boolean;
}

export function Card({ 
  children, 
  className,
  variant = 'default',
  padding = 'base',
  hoverable = false
}: CardProps) {
  const variantClasses = {
    default: 'bg-white/5 border border-white/10',
    elevated: 'bg-white/5 border border-white/10 shadow-lg',
    outlined: 'bg-transparent border border-white/20',
  };

  const paddingClasses = {
    sm: 'p-4',
    base: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={cn(
      'rounded-xl backdrop-blur-sm transition-all duration-200',
      variantClasses[variant],
      paddingClasses[padding],
      hoverable && 'hover:border-cyan-500/30 hover:bg-white/[0.07] hover:shadow-glow cursor-pointer',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * PageHeader - Consistent page header with title and actions
 */
export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  breadcrumbs?: Array<{ label: string; href: string }>;
}

export function PageHeader({ 
  title, 
  description,
  children,
  className,
  breadcrumbs
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <nav className="flex items-center gap-2 text-sm text-white/50 mb-4">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              <a
                href={crumb.href}
                className="hover:text-cyan-400 transition"
              >
                {crumb.label}
              </a>
            </span>
          ))}
        </nav>
      )}

      {/* Title and Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-white/60 text-base">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * EmptyState - Professional empty state component
 */
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon,
  title, 
  description,
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 text-center',
      className
    )}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-white/60 max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * LoadingSkeleton - Consistent loading states
 */
export function LoadingSkeleton({ 
  lines = 3,
  className 
}: { lines?: number; className?: string }) {
  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-white/10 rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}
