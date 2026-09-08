import { memoryStore } from '@/lib/cache/redis';

const RPM_LIMITS: Record<string, number> = {
  zhipu: 1,
  agnes: 20,
  groq: 30,
  openrouter: 20,
};

const COOLDOWN_PERIODS: Record<string, number> = {
  zhipu: 60000,
  agnes: 60000,
  groq: 60000,
  openrouter: 60000,
};

export class RateLimiter {
  private cooldowns: Record<string, number> = {};

  async check(provider: string): Promise<boolean> {
    const key = `ratelimit:${provider}`;
    const limit = RPM_LIMITS[provider] || 10;
    const current = memoryStore.increment(key, 60);

    if (this.cooldowns[provider] && Date.now() < this.cooldowns[provider]) {
      console.warn(`[RateLimiter] ${provider} in cooldown until ${new Date(this.cooldowns[provider]).toISOString()}`);
      return false;
    }

    if (current > limit) {
      this.cooldowns[provider] = Date.now() + (COOLDOWN_PERIODS[provider] || 60000);
      console.warn(`[RateLimiter] ${provider} rate limit exceeded, entering cooldown`);
      return false;
    }

    return true;
  }

  reset(provider: string): void {
    memoryStore.reset(`ratelimit:${provider}`);
    delete this.cooldowns[provider];
  }

  getUsage(provider: string) {
    const key = `ratelimit:${provider}`;
    const entry = memoryStore.get(key);
    return {
      current: entry?.count || 0,
      limit: RPM_LIMITS[provider] || 10,
      cooldownUntil: this.cooldowns[provider] || null,
    };
  }
}
