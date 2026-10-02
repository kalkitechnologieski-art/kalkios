/**
 * SIDDHI v4.0 — Enterprise Resilience Layer
 * 
 * Circuit breaker, retry logic, graceful degradation, and error recovery
 * for high-availability AI services.
 */

import { logger } from '@/lib/utils/logger';

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitter: boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenMaxRequests: number;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private halfOpenRequests = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (!this.shouldAttemptRecovery()) {
        throw new CircuitBreakerError('Circuit is open - service unavailable');
      }
      this.state = 'half-open';
      this.halfOpenRequests = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.halfOpenRequests = 0;
  }

  private onSuccess() {
    this.successes++;
    
    if (this.state === 'half-open') {
      this.halfOpenRequests++;
      if (this.halfOpenRequests >= this.options.halfOpenMaxRequests) {
        this.state = 'closed';
        this.failures = 0;
        logger.info('[CircuitBreaker] Closed - service recovered');
      }
    } else {
      // Reset failure count on success in closed state
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      this.state = 'open';
      logger.warn('[CircuitBreaker] Opened - half-open request failed');
    } else if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
      logger.warn('[CircuitBreaker] Opened - failure threshold reached', { failures: this.failures });
    }
  }

  private shouldAttemptRecovery(): boolean {
    if (!this.lastFailureTime) return true;
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return timeSinceLastFailure >= this.options.recoveryTimeoutMs;
  }
}

export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Retry with exponential backoff and jitter
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffFactor: 2,
    jitter: true,
    ...options,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === opts.maxAttempts) {
        break;
      }

      const delay = calculateBackoff(attempt, opts);
      logger.warn(`[Retry] Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms`, { error: lastError.message });
      
      await sleep(delay);
    }
  }

  throw new RetryError(`Failed after ${opts.maxAttempts} attempts`, lastError!);
}

export class RetryError extends Error {
  constructor(message: string, public override cause: Error) {
    super(message);
    this.name = 'RetryError';
  }
}

function calculateBackoff(attempt: number, options: RetryOptions): number {
  const exponential = options.baseDelayMs * Math.pow(options.backoffFactor, attempt - 1);
  const capped = Math.min(exponential, options.maxDelayMs);
  
  if (options.jitter) {
    // Add random jitter ±25%
    const jitter = capped * 0.25 * (Math.random() * 2 - 1);
    return Math.max(0, capped + jitter);
  }
  
  return capped;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Graceful degradation - try multiple fallback strategies
 */
export interface FallbackStrategy<T> {
  name: string;
  execute: () => Promise<T>;
  isEnabled: () => boolean;
}

export async function executeWithFallback<T>(
  primary: FallbackStrategy<T>,
  fallbacks: FallbackStrategy<T>[]
): Promise<T> {
  const strategies = [primary, ...fallbacks];
  
  for (const strategy of strategies) {
    if (!strategy.isEnabled()) {
      logger.debug(`[Fallback] Strategy ${strategy.name} disabled, skipping`);
      continue;
    }

    try {
      logger.debug(`[Fallback] Trying strategy: ${strategy.name}`);
      const result = await strategy.execute();
      logger.debug(`[Fallback] Strategy ${strategy.name} succeeded`);
      return result;
    } catch (error) {
      logger.warn(`[Fallback] Strategy ${strategy.name} failed`, { error });
    }
  }

  throw new FallbackError('All fallback strategies exhausted');
}

export class FallbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FallbackError';
  }
}

/**
 * Request deduplication - prevent duplicate in-flight requests
 */
export class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      logger.debug(`[Dedup] Reusing pending request for key: ${key}`);
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = fn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pendingRequests.clear();
  }

  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

/**
 * Timeout wrapper with custom error messages
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fn();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TimeoutError(errorMessage ?? `Operation timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Health check monitor for external services
 */
export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: number;
  consecutiveFailures: number;
}

export class HealthMonitor {
  private healthStatus: Map<string, ServiceHealth> = new Map();

  recordSuccess(name: string, latencyMs: number) {
    const current = this.healthStatus.get(name) || {
      name,
      status: 'healthy',
      latency: 0,
      lastCheck: 0,
      consecutiveFailures: 0,
    };

    this.healthStatus.set(name, {
      ...current,
      status: 'healthy',
      latency: latencyMs,
      lastCheck: Date.now(),
      consecutiveFailures: 0,
    });
  }

  recordFailure(name: string) {
    const current = this.healthStatus.get(name) || {
      name,
      status: 'healthy',
      latency: 0,
      lastCheck: 0,
      consecutiveFailures: 0,
    };

    const consecutiveFailures = current.consecutiveFailures + 1;
    let status: ServiceHealth['status'] = 'healthy';
    
    if (consecutiveFailures >= 5) {
      status = 'unhealthy';
    } else if (consecutiveFailures >= 2) {
      status = 'degraded';
    }

    this.healthStatus.set(name, {
      ...current,
      status,
      lastCheck: Date.now(),
      consecutiveFailures,
    });
  }

  getHealth(name: string): ServiceHealth | null {
    return this.healthStatus.get(name) || null;
  }

  getAllHealth(): Map<string, ServiceHealth> {
    return new Map(this.healthStatus);
  }

  isHealthy(name: string): boolean {
    const health = this.healthStatus.get(name);
    return health?.status !== 'unhealthy';
  }
}

// Singleton instances
export const globalDeduplicator = new RequestDeduplicator();
export const globalHealthMonitor = new HealthMonitor();

// Circuit breakers for each provider
export const circuitBreakers = {
  groq: new CircuitBreaker({ failureThreshold: 5, recoveryTimeoutMs: 60000, halfOpenMaxRequests: 3 }),
  agnes: new CircuitBreaker({ failureThreshold: 5, recoveryTimeoutMs: 60000, halfOpenMaxRequests: 3 }),
  zhipu: new CircuitBreaker({ failureThreshold: 5, recoveryTimeoutMs: 60000, halfOpenMaxRequests: 3 }),
  openrouter: new CircuitBreaker({ failureThreshold: 5, recoveryTimeoutMs: 60000, halfOpenMaxRequests: 3 }),
};
