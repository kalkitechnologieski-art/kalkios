// == KALKI B6 HARDENING ==
// Production Redis client with Upstash (serverless-compatible)
// Falls back to in-memory cache if Redis unavailable
// -----------------------------------------------------------------------------

import { Redis } from '@upstash/redis';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// In-memory fallback
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

// Check if Redis is available
let redisClient: Redis | null = null;
let redisAvailable = false;

if (REDIS_URL && REDIS_TOKEN) {
  try {
    redisClient = new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    });
    redisAvailable = true;
  } catch (err) {
    console.warn('[Redis] Failed to initialize:', err);
    redisAvailable = false;
  }
} else {
  console.warn('[Redis] UPSTASH_REDIS_REST_URL not configured, using in-memory cache');
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (redisAvailable && redisClient) {
      try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value as string) : null;
      } catch (err) {
        console.error('[Redis] GET failed:', err);
      }
    }
    
    // Fallback to in-memory
    const entry = memoryCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value as T;
    }
    memoryCache.delete(key);
    return null;
  },

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || 3600; // Default 1 hour
    
    if (redisAvailable && redisClient) {
      try {
        await redisClient.setex(key, ttl, JSON.stringify(value));
        return;
      } catch (err) {
        console.error('[Redis] SET failed:', err);
      }
    }
    
    // Fallback to in-memory
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  },

  async del(key: string): Promise<void> {
    if (redisAvailable && redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch (err) {
        console.error('[Redis] DEL failed:', err);
      }
    }
    
    memoryCache.delete(key);
  },

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const ttl = ttlSeconds || 60;
    
    if (redisAvailable && redisClient) {
      try {
        const newValue = await redisClient.incr(key);
        await redisClient.expire(key, ttl);
        return newValue;
      } catch (err) {
        console.error('[Redis] INCR failed:', err);
      }
    }
    
    // Fallback to in-memory
    const current = (memoryCache.get(key)?.value as number) || 0;
    const newValue = current + 1;
    memoryCache.set(key, {
      value: newValue,
      expiresAt: Date.now() + ttl * 1000,
    });
    return newValue;
  },

  async exists(key: string): Promise<boolean> {
    if (redisAvailable && redisClient) {
      try {
        const result = await redisClient.exists(key);
        return result === 1;
      } catch (err) {
        console.error('[Redis] EXISTS failed:', err);
      }
    }
    
    const entry = memoryCache.get(key);
    return !!(entry && entry.expiresAt > Date.now());
  },

  // Rate limiting specific methods
  async incrementWithTTL(key: string, windowSeconds: number): Promise<number> {
    const count = await this.incr(key, windowSeconds);
    return count;
  },

  async getRemainingTTL(key: string): Promise<number> {
    if (redisAvailable && redisClient) {
      try {
        const ttl = await redisClient.ttl(key);
        return Math.max(0, ttl);
      } catch (err) {
        console.error('[Redis] TTL failed:', err);
      }
    }
    
    const entry = memoryCache.get(key);
    if (entry) {
      return Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
    }
    return 0;
  },

  // Clear all in-memory cache (for testing)
  clear(): void {
    memoryCache.clear();
  },

  // Get stats
  getStats(): { redisAvailable: boolean; memorySize: number } {
    return {
      redisAvailable,
      memorySize: memoryCache.size,
    };
  },
};

export default cache;
