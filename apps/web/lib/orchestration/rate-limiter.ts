// == KALKI B6 HARDENING ==
// Adaptive rate limiter: sliding-window RPM + daily quota + header learning +
// per-provider token bucket with wait-time hints. Works under concurrency.
// -----------------------------------------------------------------------------

import { Semaphore } from './concurrency';

export interface RateLimitSnapshot {
  remaining: number;
  limit: number;
  resetAt: number;
  windowMs: number;
  source: 'header' | 'learned' | 'default';
}

interface ProviderLimits {
  rpm: number;
  rpd: number;
  burst: number;
}

const DEFAULT_LIMITS: Record<string, ProviderLimits> = {
  device:     { rpm: Infinity, rpd: Infinity, burst: Infinity },
  zai:        { rpm: 60,       rpd: 1_000,    burst: 4 },
  zhipu:      { rpm: 60,       rpd: 1_000,    burst: 4 },
  groq:       { rpm: 30,       rpd: 1_000,    burst: 8 },
  openrouter: { rpm: 20,       rpd: 50,       burst: 4 },
  agnes:      { rpm: 60,       rpd: 200,      burst: 6 },
  swarm:      { rpm: Infinity, rpd: Infinity, burst: Infinity },
  cache:      { rpm: Infinity, rpd: Infinity, burst: Infinity },
  search:     { rpm: 300,      rpd: 20_000,   burst: 20 },
};

function parseDuration(s: string): number {
  let ms = 0;
  const re = /(\d+(?:\.\d+)?)(ms|s|m|h)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const v = parseFloat(m[1] ?? '0');
    const unit = m[2] ?? 's';
    const mult: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };
    ms += v * (mult[unit] ?? 1000);
  }
  return ms || 60_000;
}

function msUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return midnight.getTime() - now.getTime();
}

export class AdaptiveRateLimiter {
  private quotas = new Map<string, RateLimitSnapshot>();
  private minuteCounters = new Map<string, number[]>();
  private dailyCounters = new Map<string, number>();
  private readonly semaphores = new Map<string, Semaphore>();

  private getSemaphore(provider: string): Semaphore {
    let s = this.semaphores.get(provider);
    if (!s) {
      const limits = DEFAULT_LIMITS[provider] ?? { rpm: 10, rpd: 1000, burst: 2 };
      s = new Semaphore({
        maxConcurrency: Math.max(1, Math.min(limits.burst, 8)),
        name: `rate:${provider}`,
      });
      this.semaphores.set(provider, s);
    }
    return s;
  }

  learn(provider: string, headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining-requests') ?? headers.get('x-ratelimit-remaining');
    const limit = headers.get('x-ratelimit-limit-requests') ?? headers.get('x-ratelimit-limit');
    const reset = headers.get('x-ratelimit-reset-requests') ?? headers.get('x-ratelimit-reset');

    if (remaining !== null && limit !== null) {
      const resetMs = reset ? parseDuration(reset) : 60_000;
      this.quotas.set(provider, {
        remaining: Number(remaining),
        limit: Number(limit),
        resetAt: Date.now() + resetMs,
        windowMs: resetMs,
        source: 'header',
      });
    }
  }

  async check(provider: string): Promise<{ allowed: boolean; waitMs: number; reason?: string }> {
    const now = Date.now();
    const defaults = DEFAULT_LIMITS[provider] ?? { rpm: 10, rpd: 1000, burst: 2 };

    const minuteWindow = (this.minuteCounters.get(provider) ?? []).filter((t) => now - t < 60_000);
    this.minuteCounters.set(provider, minuteWindow);

    if (minuteWindow.length >= defaults.rpm) {
      const oldest = minuteWindow[0] ?? now;
      return { allowed: false, waitMs: Math.max(0, 60_000 - (now - oldest) + 50), reason: 'rpm' };
    }

    const daily = this.dailyCounters.get(provider) ?? 0;
    if (daily >= defaults.rpd) return { allowed: false, waitMs: msUntilMidnightUTC(), reason: 'rpd' };

    const snap = this.quotas.get(provider);
    if (snap && snap.resetAt > now && snap.remaining <= 0) {
      return { allowed: false, waitMs: snap.resetAt - now, reason: 'header' };
    }

    return { allowed: true, waitMs: 0 };
  }

  record(provider: string): void {
    const now = Date.now();
    const arr = this.minuteCounters.get(provider) ?? [];
    arr.push(now);
    this.minuteCounters.set(provider, arr);
    this.dailyCounters.set(provider, (this.dailyCounters.get(provider) ?? 0) + 1);
    const snap = this.quotas.get(provider);
    if (snap && snap.remaining > 0) snap.remaining -= 1;
  }

  /** Wrap an async task with a concurrency slot + rate check + slot record. */
  async run<T>(provider: string, fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    const sem = this.getSemaphore(provider);
    const release = await sem.acquire(signal);
    try {
      const check = await this.check(provider);
      if (!check.allowed) {
        const wait = Math.min(check.waitMs, 5000);
        await new Promise((r) => setTimeout(r, wait));
      }
      const result = await fn();
      this.record(provider);
      return result;
    } finally {
      release();
    }
  }

  snapshot(): Record<string, { rpm: number; rpd: number; minuteCount: number; dailyCount: number; queued: number; active: number }> {
    const out: Record<string, { rpm: number; rpd: number; minuteCount: number; dailyCount: number; queued: number; active: number }> = {};
    const now = Date.now();
    for (const [provider, limits] of Object.entries(DEFAULT_LIMITS)) {
      const minute = (this.minuteCounters.get(provider) ?? []).filter((t) => now - t < 60_000);
      const sem = this.semaphores.get(provider);
      const stats = sem?.getStats() ?? { active: 0, queued: 0 };
      out[provider] = {
        rpm: limits.rpm === Infinity ? -1 : limits.rpm,
        rpd: limits.rpd === Infinity ? -1 : limits.rpd,
        minuteCount: minute.length,
        dailyCount: this.dailyCounters.get(provider) ?? 0,
        queued: stats.queued,
        active: stats.active,
      };
    }
    return out;
  }
}

export const globalRateLimiter = new AdaptiveRateLimiter();
export class RateLimiter extends AdaptiveRateLimiter {}
