import nopeRedis from 'nope-redis';

// Configure nope-redis with supported options
nopeRedis.config({
  defaultTtl: 60,          // Default TTL in seconds
  maxMemorySize: 100,      // Max memory in MB (optional)
  evictionPolicy: 'lru',   // 'lru' or 'lfu'
});

// Export a simple client with fallback to in-memory Map
const fallbackCache = new Map<string, { value: any; expiresAt: number }>();

// Helper to check if nope-redis is working
let nopeWorking = true;

try {
  nopeRedis.setItem('__test__', 'ok', 1);
  const test = nopeRedis.getItem('__test__');
  if (test !== 'ok') nopeWorking = false;
  nopeRedis.deleteItem('__test__');
} catch {
  nopeWorking = false;
  console.warn('nope-redis failed, using fallback in-memory cache');
}

export const redisClient = {
  getItem: (key: string): any => {
    if (nopeWorking) {
      try {
        return nopeRedis.getItem(key);
      } catch {
        // fallback
      }
    }
    const entry = fallbackCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    fallbackCache.delete(key);
    return undefined;
  },

  setItem: (key: string, value: any, ttlSeconds?: number): void => {
    if (nopeWorking) {
      try {
        nopeRedis.setItem(key, value, ttlSeconds);
        return;
      } catch {
        // fallback
      }
    }
    const ttl = ttlSeconds || 60;
    fallbackCache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  },

  get: (key: string): string | null => {
    const val = redisClient.getItem(key);
    return val !== undefined ? JSON.stringify(val) : null;
  },

  set: (key: string, value: string, ttlSeconds?: number): void => {
    try {
      redisClient.setItem(key, JSON.parse(value), ttlSeconds);
    } catch {
      redisClient.setItem(key, value, ttlSeconds);
    }
  },

  setex: (key: string, ttl: number, value: string): void => {
    redisClient.set(key, value, ttl);
  },

  incr: (key: string): number => {
    if (nopeWorking) {
      try {
        const current = (nopeRedis.getItem(key) as number) || 0;
        const newVal = current + 1;
        nopeRedis.setItem(key, newVal);
        return newVal;
      } catch {
        // fallback
      }
    }
    const current = (fallbackCache.get(key)?.value as number) || 0;
    const newVal = current + 1;
    fallbackCache.set(key, { value: newVal, expiresAt: Date.now() + 60000 });
    return newVal;
  },

  expire: (key: string, ttl: number): void => {
    if (nopeWorking) {
      try {
        const value = nopeRedis.getItem(key);
        if (value !== undefined) {
          nopeRedis.setItem(key, value, ttl);
        }
        return;
      } catch {
        // fallback
      }
    }
    const entry = fallbackCache.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttl * 1000;
      fallbackCache.set(key, entry);
    }
  },

  del: (key: string): void => {
    if (nopeWorking) {
      try {
        nopeRedis.deleteItem(key);
        return;
      } catch {
        // fallback
      }
    }
    fallbackCache.delete(key);
  },
};

// In-memory store for rate limiting (fallback if nope-redis fails)
const memoryCache = new Map<string, { count: number; resetAt: number }>();

export const memoryStore = {
  get: (key: string): { count: number; resetAt: number } | null => {
    const entry = memoryCache.get(key);
    if (entry && entry.resetAt > Date.now()) {
      return entry;
    }
    memoryCache.delete(key);
    return null;
  },
  set: (key: string, count: number, ttlSeconds: number): void => {
    memoryCache.set(key, {
      count,
      resetAt: Date.now() + ttlSeconds * 1000,
    });
  },
  increment: (key: string, ttlSeconds: number): number => {
    const entry = memoryStore.get(key);
    if (entry) {
      const newCount = entry.count + 1;
      memoryCache.set(key, { count: newCount, resetAt: entry.resetAt });
      return newCount;
    }
    memoryCache.set(key, { count: 1, resetAt: Date.now() + ttlSeconds * 1000 });
    return 1;
  },
  reset: (key: string): void => {
    memoryCache.delete(key);
  },
  clear: (): void => {
    memoryCache.clear();
  },
};
