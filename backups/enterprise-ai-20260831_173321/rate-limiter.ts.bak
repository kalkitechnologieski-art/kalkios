import { memoryStore } from "@/lib/cache/redis";

const RPM_LIMITS: Record<string, number> = {
  agnes: 20,
  groq: 30,
  openrouter: 20,
  zhipu: 100,
};

export class RateLimiter {
  async check(provider: string): Promise<boolean> {
    const key = `ratelimit:${provider}`;
    const limit = RPM_LIMITS[provider] || 10;
    const current = memoryStore.increment(key, 60);

    // Log when rate limit is close to being exceeded
    if (current > limit * 0.8) {
      console.warn(`[RateLimiter] ${provider} at ${current}/${limit} RPM`);
    }

    return current <= limit;
  }

  // Reset rate limit for a provider (useful for testing)
  reset(provider: string): void {
    memoryStore.reset(`ratelimit:${provider}`);
  }

  // Get current usage
  getUsage(provider: string): { current: number; limit: number } {
    const key = `ratelimit:${provider}`;
    const entry = memoryStore.get(key);
    return {
      current: entry?.count || 0,
      limit: RPM_LIMITS[provider] || 10,
    };
  }
}
