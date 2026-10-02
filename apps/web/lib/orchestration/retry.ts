// == KALKI B6 HARDENING ==
// Retry engine with full jitter, per-attempt timeout, global budget.
// -----------------------------------------------------------------------------

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
  isRetryable: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
  signal?: AbortSignal;
}

const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 250,
  maxDelayMs: 8_000,
  timeoutMs: 30_000,
  isRetryable: () => true,
};

function backoff(attempt: number, base: number, cap: number): number {
  const exp = Math.min(cap, base * 2 ** attempt);
  return Math.random() * exp;
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const anyFn = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  if (typeof anyFn === 'function') return anyFn(signals);
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) { controller.abort(sig.reason); break; }
    sig.addEventListener('abort', () => controller.abort(sig.reason), { once: true });
  }
  return controller.signal;
}

export class RetryBudget {
  private spent = 0;
  private windowStart = Date.now();
  constructor(private maxPerWindow: number = 500, private windowMs: number = 60_000) {}
  trySpend(): boolean {
    const now = Date.now();
    if (now - this.windowStart > this.windowMs) { this.spent = 0; this.windowStart = now; }
    if (this.spent >= this.maxPerWindow) return false;
    this.spent += 1;
    return true;
  }
  snapshot(): { spent: number; remaining: number; windowResetInMs: number } {
    return {
      spent: this.spent,
      remaining: Math.max(0, this.maxPerWindow - this.spent),
      windowResetInMs: Math.max(0, this.windowStart + this.windowMs - Date.now()),
    };
  }
}

export const globalRetryBudget = new RetryBudget(500, 60_000);

export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_RETRY, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!globalRetryBudget.trySpend()) throw new Error('Retry budget exhausted');

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(
      () => timeoutController.abort(new Error('Timeout')),
      opts.timeoutMs
    );
    const combinedSignal = opts.signal
      ? anySignal([opts.signal, timeoutController.signal])
      : timeoutController.signal;

    try {
      return await fn(combinedSignal);
    } catch (error) {
      lastError = error;
      if (!opts.isRetryable(error)) throw error;
      if (attempt === opts.maxAttempts - 1) break;

      const delay = backoff(attempt, opts.baseDelayMs, opts.maxDelayMs);
      opts.onRetry?.(attempt + 1, error, delay);
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}
