// apps/web/lib/error-handling/error-classifier.ts
// ─────────────────────────────────────────────────────────────────────────────
// Structured error classification with recovery strategies
// Following industry patterns from ChatGPT/Claude
// ─────────────────────────────────────────────────────────────────────────────

export type ErrorClassification = 'transient' | 'permanent' | 'rate_limit' | 'timeout' | 'unknown';

export interface ClassifiedError {
  classification: ErrorClassification;
  message: string;
  userMessage: string;
  retryable: boolean;
  retryAfterMs?: number;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

/**
 * Classify an error and provide actionable recovery strategy
 */
export function classifyError(error: unknown, context?: Record<string, unknown>): ClassifiedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorString = errorMessage.toLowerCase();

  // Rate limiting errors (429)
  if (errorString.includes('429') || errorString.includes('rate limit') || errorString.includes('too many requests')) {
    const retryAfter = extractRetryAfter(errorMessage) || 60_000;
    return {
      classification: 'rate_limit',
      message: errorMessage,
      userMessage: `Rate limit exceeded. Please wait ${Math.ceil(retryAfter / 1000)} seconds before trying again.`,
      retryable: true,
      retryAfterMs: retryAfter,
      originalError: error,
      context,
    };
  }

  // Timeout errors
  if (errorString.includes('timeout') || errorString.includes('deadline') || errorString.includes('timed out')) {
    return {
      classification: 'timeout',
      message: errorMessage,
      userMessage: 'The request timed out. This may be due to high server load. Please try again.',
      retryable: true,
      retryAfterMs: 5_000,
      originalError: error,
      context,
    };
  }

  // Transient network errors (retryable)
  if (
    errorString.includes('econnrefused') ||
    errorString.includes('enetunreach') ||
    errorString.includes('network error') ||
    errorString.includes('fetch failed') ||
    errorString.includes('503') ||
    errorString.includes('502') ||
    errorString.includes('504')
  ) {
    return {
      classification: 'transient',
      message: errorMessage,
      userMessage: 'A temporary network issue occurred. Retrying automatically...',
      retryable: true,
      retryAfterMs: 3_000,
      originalError: error,
      context,
    };
  }

  // Permanent errors (authentication, validation, etc.)
  if (
    errorString.includes('401') ||
    errorString.includes('unauthorized') ||
    errorString.includes('invalid api key') ||
    errorString.includes('403') ||
    errorString.includes('forbidden') ||
    errorString.includes('400') ||
    errorString.includes('bad request') ||
    errorString.includes('validation')
  ) {
    return {
      classification: 'permanent',
      message: errorMessage,
      userMessage: getPermanentErrorMessage(errorString),
      retryable: false,
      originalError: error,
      context,
    };
  }

  // Unknown errors - treat as transient for safety
  return {
    classification: 'unknown',
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
    retryAfterMs: 5_000,
    originalError: error,
    context,
  };
}

/**
 * Extract retry-after duration from error message
 */
function extractRetryAfter(message: string): number | null {
  const match = message.match(/retry after[:\s]+(\d+)/i);
  if (match) {
    const value = parseInt(match[1], 10);
    // If value is small (< 100), assume it's in seconds
    return value < 100 ? value * 1000 : value;
  }
  return null;
}

/**
 * Get user-friendly message for permanent errors
 */
function getPermanentErrorMessage(errorString: string): string {
  if (errorString.includes('401') || errorString.includes('unauthorized') || errorString.includes('api key')) {
    return 'Authentication failed. Please check your API configuration or contact support.';
  }
  if (errorString.includes('403') || errorString.includes('forbidden')) {
    return 'Access denied. Your account may not have permission for this feature.';
  }
  if (errorString.includes('400') || errorString.includes('validation')) {
    return 'The request was invalid. Please check your input and try again.';
  }
  return 'This action cannot be completed. Please contact support if the issue persists.';
}

/**
 * Retry with exponential backoff and jitter
 * Industry standard pattern for resilient systems
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30_000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const classified = classifyError(error);

      // Don't retry permanent errors
      if (!classified.retryable) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * exponentialDelay; // ±15% jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

      // Use classified-after from server if available
      const serverDelay = classified.retryAfterMs;
      const finalDelay = serverDelay || delay;

      console.warn(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${Math.round(finalDelay / 1000)}s...`);
      await new Promise((resolve) => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError;
}

/**
 * Circuit breaker state for provider health tracking
 */
export interface CircuitBreakerState {
  failures: number;
  lastFailureAt: number;
  state: 'closed' | 'open' | 'half-open';
  successRate: number; // EMA over last 100 requests
}

/**
 * Update circuit breaker state based on request outcome
 */
export function updateCircuitBreaker(
  state: CircuitBreakerState,
  success: boolean,
  latencyMs: number
): CircuitBreakerState {
  const alpha = 0.1; // EMA smoothing factor

  const newState: CircuitBreakerState = {
    failures: success ? 0 : state.failures + 1,
    lastFailureAt: success ? state.lastFailureAt : Date.now(),
    state: state.state,
    successRate: state.successRate * (1 - alpha) + (success ? 1 : 0) * alpha,
  };

  // Transition logic
  if (newState.failures >= 5 && newState.state === 'closed') {
    newState.state = 'open';
  } else if (newState.state === 'open' && Date.now() - newState.lastFailureAt > 60_000) {
    newState.state = 'half-open';
  } else if (newState.state === 'half-open' && success) {
    newState.state = 'closed';
  }

  return newState;
}
