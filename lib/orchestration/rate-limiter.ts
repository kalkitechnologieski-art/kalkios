import { redisClient } from '@/lib/cache/redis';
const RPM_LIMITS: Record<string, number> = {
  agnes: 20,
  groq: 30,
  openrouter: 20,
  zhipu: 100,
};
export class RateLimiter {
  async check(provider: string): Promise<boolean> {
    if (!redisClient) return true;
    const key = `ratelimit:${provider}`;
    const current = await redisClient.incr(key);
    if (current === 1) await redisClient.expire(key, 60);
    const limit = RPM_LIMITS[provider] || 10;
    return current <= limit;
  }
}
