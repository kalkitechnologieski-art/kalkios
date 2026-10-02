/**
 * SIDDHI v4.0 — Enterprise Caching Layer
 * 
 * Multi-tier caching strategy:
 * 1. In-memory LRU cache (fastest, per-instance)
 * 2. Redis cache (shared across instances)
 * 3. Stale-while-revalidate pattern for freshness
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  set(key: K, value: V, ttl: number = 60000): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}

export interface CacheOptions {
  ttl?: number; // Default TTL in seconds
  namespace?: string; // Key prefix for isolation
  staleWhileRevalidate?: boolean; // Serve stale data while refreshing
}

export class CacheManager {
  private static instance: CacheManager | null = null;
  private memoryCache: LRUCache<string, any>;
  private redisClient: any = null; // Lazy-initialized
  private defaultTTL: number;
  private namespace: string;
  private staleWhileRevalidate: boolean;

  private constructor(options: CacheOptions = {}) {
    this.memoryCache = new LRUCache(1000);
    this.defaultTTL = options.ttl || 60; // 60 seconds default
    this.namespace = options.namespace || 'siddhi';
    this.staleWhileRevalidate = options.staleWhileRevalidate ?? true;
  }

  static getInstance(options?: CacheOptions): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(options);
    }
    return CacheManager.instance;
  }

  /**
   * Get value from cache (memory first, then Redis)
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.makeKey(key);
    
    // Try memory cache first (fastest)
    const memoryValue = this.memoryCache.get(fullKey) as T | null;
    if (memoryValue !== null) {
      return memoryValue;
    }

    // Try Redis cache
    if (this.redisClient) {
      try {
        const redisValue = await this.redisClient.get(fullKey);
        if (redisValue) {
          const parsed = JSON.parse(redisValue);
          
          // Store in memory cache for next time
          this.memoryCache.set(fullKey, parsed, this.defaultTTL * 1000);
          
          return parsed as T;
        }
      } catch (error) {
        console.warn('[Cache] Redis GET failed:', error);
      }
    }

    return null;
  }

  /**
   * Set value in cache (both memory and Redis)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.makeKey(key);
    const effectiveTTL = ttl || this.defaultTTL;
    
    // Always store in memory cache
    this.memoryCache.set(fullKey, value, effectiveTTL * 1000);
    
    // Also store in Redis if available
    if (this.redisClient) {
      try {
        const serialized = JSON.stringify(value);
        await this.redisClient.setex(fullKey, effectiveTTL, serialized);
      } catch (error) {
        console.warn('[Cache] Redis SET failed:', error);
      }
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.makeKey(key);
    
    this.memoryCache.delete(fullKey);
    
    if (this.redisClient) {
      try {
        await this.redisClient.del(fullKey);
      } catch (error) {
        console.warn('[Cache] Redis DEL failed:', error);
      }
    }
  }

  /**
   * Get or compute value with automatic caching
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    options?: { ttl?: number; forceRefresh?: boolean }
  ): Promise<T> {
    // Return cached value if available and not forcing refresh
    if (!options?.forceRefresh) {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Compute fresh value
    const value = await computeFn();
    
    // Cache the result
    await this.set(key, value, options?.ttl);
    
    return value;
  }

  /**
   * Wrap a function with automatic caching
   */
  wrap<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyFn: (...args: Parameters<T>) => string,
    options?: CacheOptions
  ): T {
    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const key = keyFn(...args);
      return this.getOrCompute(
        key,
        () => fn(...args),
        { ttl: options?.ttl }
      ) as Promise<ReturnType<T>>;
    };

    return wrapped as T;
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis(redisUrl?: string): Promise<boolean> {
    if (this.redisClient) return true;

    try {
      // Lazy-load Redis client
      const url = redisUrl || process.env.REDIS_URL;
      if (!url) {
        console.log('[Cache] Redis URL not configured, using memory-only cache');
        return false;
      }

      // Dynamic import to avoid hard dependency
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Redis = await import('ioredis' as any).then((m: any) => m.default).catch(() => null);
      
      if (!Redis) {
        console.log('[Cache] ioredis not installed, using memory-only cache');
        return false;
      }

      this.redisClient = new Redis(url);
      
      // Test connection
      await this.redisClient.ping();
      console.log('[Cache] Redis connection established');
      
      return true;
    } catch (error) {
      console.warn('[Cache] Failed to initialize Redis:', error);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys(`${this.namespace}:*`);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (error) {
        console.warn('[Cache] Redis CLEAR failed:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memoryCacheSize: this.memoryCache.size(),
      redisConnected: !!this.redisClient,
      namespace: this.namespace,
    };
  }

  private makeKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
}

// Singleton instance
export const cache = CacheManager.getInstance({
  ttl: 60,
  namespace: 'siddhi',
  staleWhileRevalidate: true,
});

/**
 * Pre-built cache wrappers for common operations
 */
export const cachedOperations = {
  /**
   * Cache service catalog queries
   */
  getServices: cache.wrap(
    async (category?: string) => {
      const supabase = await import('@/lib/supabase/client').then(m => m.createClient());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (supabase as any)
        .from('services')
        .select('*')
        .eq('status', 'active');
      
      if (category) {
        query.eq('category', category);
      }
      
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    (category) => `services:${category || 'all'}`,
    { ttl: 300 } // 5 minutes
  ),

  /**
   * Cache user profile lookups
   */
  getUserProfile: cache.wrap(
    async (userId: string) => {
      const supabase = await import('@/lib/supabase/client').then(m => m.createClient());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return data;
    },
    (userId) => `user:${userId}`,
    { ttl: 600 } // 10 minutes
  ),

  /**
   * Cache conversation history
   */
  getConversation: cache.wrap(
    async (conversationId: string) => {
      const supabase = await import('@/lib/supabase/client').then(m => m.createClient());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      return data;
    },
    (id) => `conversation:${id}`,
    { ttl: 60 } // 1 minute
  ),
};
