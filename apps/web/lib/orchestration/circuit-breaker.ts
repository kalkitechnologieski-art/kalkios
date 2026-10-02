// == KALKI B6 HARDENING ==
// Circuit breaker with sliding window + half-open probes + jitter reset.
// -----------------------------------------------------------------------------

export type BreakerState = 'closed' | 'open' | 'half-open';

export interface BreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  windowMs: number;
  cooldownMs: number;
  halfOpenProbes: number;
  jitterMs: number;
}

const DEFAULT_CONFIG: BreakerConfig = {
  failureThreshold: 5,
  successThreshold: 3,
  windowMs: 60_000,
  cooldownMs: 30_000,
  halfOpenProbes: 2,
  jitterMs: 5000,
};

interface BreakerRecord {
  state: BreakerState;
  failures: number[];
  successes: number[];
  openedAt: number;
  halfOpenAttempts: number;
  jitterUntil: number;
}

export interface BreakerSnapshot {
  state: BreakerState;
  failures: number;
  successes: number;
  openedAt: number | null;
  halfOpenAttempts: number;
}

export class AdaptiveCircuitBreaker {
  private records = new Map<string, BreakerRecord>();
  private config: BreakerConfig;

  constructor(config: Partial<BreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getRecord(key: string): BreakerRecord {
    let r = this.records.get(key);
    if (!r) {
      r = { state: 'closed', failures: [], successes: [], openedAt: 0, halfOpenAttempts: 0, jitterUntil: 0 };
      this.records.set(key, r);
    }
    return r;
  }

  private prune(record: BreakerRecord, now: number): void {
    const cutoff = now - this.config.windowMs;
    record.failures = record.failures.filter((t) => t > cutoff);
    record.successes = record.successes.filter((t) => t > cutoff);
  }

  private maybeHalfOpen(record: BreakerRecord, now: number): void {
    if (record.state === 'open' && now >= record.jitterUntil) {
      record.state = 'half-open';
      record.halfOpenAttempts = 0;
    }
  }

  canAttempt(key: string): boolean {
    const now = Date.now();
    const r = this.getRecord(key);
    this.prune(r, now);
    this.maybeHalfOpen(r, now);

    if (r.state === 'closed') return true;
    if (r.state === 'open') return false;
    if (r.halfOpenAttempts >= this.config.halfOpenProbes) return false;
    r.halfOpenAttempts += 1;
    return true;
  }

  recordSuccess(key: string): void {
    const now = Date.now();
    const r = this.getRecord(key);
    r.successes.push(now);
    this.prune(r, now);
    this.maybeHalfOpen(r, now);

    if (r.state === 'half-open') {
      if (r.successes.length >= this.config.successThreshold) {
        r.state = 'closed';
        r.failures = [];
        r.successes = [];
        r.halfOpenAttempts = 0;
      }
    } else if (r.state === 'closed') {
      if (r.failures.length > 0 && r.successes.length > r.failures.length * 2) {
        r.failures = [];
      }
    }
  }

  recordFailure(key: string): void {
    const now = Date.now();
    const r = this.getRecord(key);
    r.failures.push(now);
    this.prune(r, now);
    this.maybeHalfOpen(r, now);

    if (r.state === 'half-open') {
      r.state = 'open';
      r.openedAt = now;
      r.halfOpenAttempts = 0;
      r.jitterUntil = now + this.config.cooldownMs + Math.random() * this.config.jitterMs;
      return;
    }

    if (r.state === 'closed' && r.failures.length >= this.config.failureThreshold) {
      r.state = 'open';
      r.openedAt = now;
      r.jitterUntil = now + this.config.cooldownMs + Math.random() * this.config.jitterMs;
    }
  }

  isOpen(key: string): boolean {
    return !this.canAttempt(key);
  }

  snapshot(): Record<string, BreakerSnapshot> {
    const out: Record<string, BreakerSnapshot> = {};
    const now = Date.now();
    for (const [key, r] of this.records) {
      this.prune(r, now);
      this.maybeHalfOpen(r, now);
      out[key] = {
        state: r.state,
        failures: r.failures.length,
        successes: r.successes.length,
        openedAt: r.openedAt || null,
        halfOpenAttempts: r.halfOpenAttempts,
      };
    }
    return out;
  }

  reset(key: string): void { this.records.delete(key); }
  resetAll(): void { this.records.clear(); }
}

export const globalBreaker = new AdaptiveCircuitBreaker();
export class CircuitBreaker extends AdaptiveCircuitBreaker {}
