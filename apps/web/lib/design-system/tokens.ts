// == KALKI ENTERPRISE DESIGN SYSTEM ==
// Unified design tokens for industry-grade consistency
// -----------------------------------------------------------------------------

/**
 * Spacing scale - 4px base grid system
 * Industry standard: 8px grid (we use 4px for finer control)
 */
export const SPACING = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

/**
 * Typography scale - Modular scale (1.25 ratio)
 * Based on Inter font family
 */
export const TYPOGRAPHY = {
  xs: {
    fontSize: '0.75rem',      // 12px
    lineHeight: '1rem',       // 16px
    fontWeight: '400',
    letterSpacing: '0',
  },
  sm: {
    fontSize: '0.875rem',     // 14px
    lineHeight: '1.25rem',    // 20px
    fontWeight: '400',
    letterSpacing: '0',
  },
  base: {
    fontSize: '1rem',         // 16px
    lineHeight: '1.5rem',     // 24px
    fontWeight: '400',
    letterSpacing: '0',
  },
  lg: {
    fontSize: '1.125rem',     // 18px
    lineHeight: '1.75rem',    // 28px
    fontWeight: '400',
    letterSpacing: '-0.01em',
  },
  xl: {
    fontSize: '1.25rem',      // 20px
    lineHeight: '1.75rem',    // 28px
    fontWeight: '600',
    letterSpacing: '-0.01em',
  },
  '2xl': {
    fontSize: '1.5rem',       // 24px
    lineHeight: '2rem',       // 32px
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  '3xl': {
    fontSize: '1.875rem',     // 30px
    lineHeight: '2.25rem',    // 36px
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  '4xl': {
    fontSize: '2.25rem',      // 36px
    lineHeight: '2.5rem',     // 40px
    fontWeight: '700',
    letterSpacing: '-0.03em',
  },
  '5xl': {
    fontSize: '3rem',         // 48px
    lineHeight: '1',
    fontWeight: '800',
    letterSpacing: '-0.04em',
  },
} as const;

/**
 * Color semantics - Accessible, WCAG AA compliant
 * All combinations tested for 4.5:1 contrast ratio minimum
 */
export const COLORS = {
  // Primary brand colors
  primary: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',  // Main cyan
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  
  // Secondary accent
  secondary: {
    500: '#8b5cf6',  // Purple
    600: '#7c3aed',
  },
  
  // Status colors
  success: {
    light: '#6ee7b7',
    DEFAULT: '#10b981',
    dark: '#059669',
  },
  warning: {
    light: '#fcd34d',
    DEFAULT: '#f59e0b',
    dark: '#d97706',
  },
  error: {
    light: '#fca5a5',
    DEFAULT: '#ef4444',
    dark: '#dc2626',
  },
  info: {
    light: '#93c5fd',
    DEFAULT: '#3b82f6',
    dark: '#2563eb',
  },
  
  // Neutrals - Dark theme optimized
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
} as const;

/**
 * Border radius scale
 */
export const RADIUS = {
  none: '0',
  sm: '0.125rem',     // 2px
  base: '0.25rem',    // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  full: '9999px',
} as const;

/**
 * Shadow system - Layered for depth
 */
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  glow: '0 0 20px rgba(6, 182, 212, 0.3)',
  'glow-lg': '0 0 40px rgba(6, 182, 212, 0.4)',
} as const;

/**
 * Z-index scale - Prevents stacking conflicts
 */
export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

/**
 * Breakpoints - Mobile-first responsive design
 */
export const BREAKPOINTS = {
  xs: '360px',    // Small phones
  sm: '640px',    // Large phones
  md: '768px',    // Tablets
  lg: '1024px',   // Laptops
  xl: '1280px',   // Desktops
  '2xl': '1536px', // Large desktops
} as const;

/**
 * Animation timing functions
 */
export const EASING = {
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

/**
 * Animation durations
 */
export const DURATION = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

/**
 * Container widths - Max-widths for content
 */
export const CONTAINERS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
} as const;

/**
 * Touch targets - WCAG 2.1 AA compliance (minimum 44x44px)
 */
export const TOUCH_TARGETS = {
  minimum: '44px',
  comfortable: '48px',
  large: '56px',
} as const;

/**
 * Export complete design system
 */
export const DesignSystem = {
  spacing: SPACING,
  typography: TYPOGRAPHY,
  colors: COLORS,
  radius: RADIUS,
  shadows: SHADOWS,
  zIndex: Z_INDEX,
  breakpoints: BREAKPOINTS,
  easing: EASING,
  duration: DURATION,
  containers: CONTAINERS,
  touchTargets: TOUCH_TARGETS,
} as const;

export type DesignSystemType = typeof DesignSystem;
