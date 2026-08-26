export interface BaseError {
  readonly code: string
  readonly message: string
  readonly timestamp: Date
  readonly correlationId: string
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
}
export interface NetworkError extends BaseError { readonly type: 'network'; readonly status?: number; readonly url: string; readonly isTimeout: boolean; readonly isRetryable: boolean }
export interface ValidationError extends BaseError { readonly type: 'validation'; readonly field: string; readonly value: unknown; readonly rule: string }
export interface BusinessError extends BaseError { readonly type: 'business'; readonly domain: 'payment' | 'auth' | 'order' | 'chat' | 'project'; readonly action: string }
export interface SystemError extends BaseError { readonly type: 'system'; readonly component: 'database' | 'cache' | 'llm' | 'queue' | 'search'; readonly isRecoverable: boolean }
export type AppError = NetworkError | ValidationError | BusinessError | SystemError
