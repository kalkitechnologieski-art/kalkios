import { redisClient } from "@/lib/cache/redis";

// RPM limits from Agnes AI documentation (Free tier)
// https://wiki.agnes-ai.com/token-plan-faq
const RPM_LIMITS: Record<string, number> = {
  agnes: 20,      // Free tier
  groq: 30,       // Groq free tier
  openrouter: 20, // OpenRouter free tier
  zhipu: 100,     // Zhipu paid tier
};

export class RateLimiter {
  async check(provider: string): Promise<boolean> {
    const key = `ratelimit:${provider}`;
    if (!redisClient) return true;
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, 60);
    }
    const limit = RPM_LIMITS[provider] || 10;
    return current <= limit;
  }
}
