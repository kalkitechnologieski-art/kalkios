// lib/ai/enhanced/cache.ts
// In-memory LRU cache (no Redis dependency)

import { ConsensusResult } from './types';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

export class InMemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    entry.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttlSeconds = 3600): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      hits: 0,
    });
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestHit = Infinity;
    for (const [key, entry] of this.cache) {
      if (entry.hits < oldestHit) {
        oldestHit = entry.hits;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Singleton instances for different cache types
export const imageCache = new InMemoryCache<string>(50);
export const videoCache = new InMemoryCache<string>(20);
export const deepThinkCache = new InMemoryCache<ConsensusResult>(30);
