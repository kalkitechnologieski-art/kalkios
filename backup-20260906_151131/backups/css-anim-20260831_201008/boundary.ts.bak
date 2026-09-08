import { AppError } from './types'

export function isAppError(err: unknown): err is AppError {
  return typeof err === 'object' && err !== null && 'code' in err && 'severity' in err
}
export function toAppError(err: unknown): AppError {
  if (isAppError(err)) return err
  return {
    code: 'UNKNOWN_ERROR',
    message: err instanceof Error ? err.message : String(err),
    timestamp: new Date(),
    correlationId: crypto.randomUUID(),
    severity: 'high',
  } as AppError
}
