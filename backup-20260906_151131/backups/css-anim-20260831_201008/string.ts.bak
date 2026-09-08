/**
 * Safely converts any value to a string for display.
 * Handles objects, arrays, null, undefined, and React elements.
 */
export function toSafeString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '[Object]'
    }
  }
  return String(value)
}

/**
 * Ensures a value is a string, with fallback.
 */
export function ensureString(value: unknown, fallback: string = ''): string {
  const str = toSafeString(value)
  return str || fallback
}
