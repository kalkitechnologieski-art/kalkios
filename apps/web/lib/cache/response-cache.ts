import { redisClient } from "./redis";

interface CacheEntry {
  data: any;
  expiresAt: number;
}

// Simple in-memory fallback if nope-redis is unavailable
const memoryCache = new Map<string, CacheEntry>();

export class ResponseCache {
  private ttl = 3600; // 1 hour

  async get(messages: any[]): Promise<any | null> {
    const key = this.buildKey(messages);

    // Try nope-redis first
    try {
      const entry = redisClient.getItem(key);
      if (entry && entry.expiresAt > Date.now()) {
        return entry.data;
      }
    } catch {}

    // Fallback to memory cache
    const fallbackEntry = memoryCache.get(key);
    if (fallbackEntry && fallbackEntry.expiresAt > Date.now()) {
      return fallbackEntry.data;
    }
    memoryCache.delete(key);
    return null;
  }

  async set(messages: any[], response: any): Promise<void> {
    const key = this.buildKey(messages);
    const entry = {
      data: response,
      expiresAt: Date.now() + this.ttl * 1000,
    };

    // Try nope-redis first
    try {
      redisClient.setItem(key, entry, this.ttl);
    } catch {
      // Fallback to memory cache
      memoryCache.set(key, entry);
    }
  }

  async clear(): Promise<void> {
    memoryCache.clear();
  }

  private buildKey(messages: any[]): string {
    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (!lastUser) return "cache:default";
    return `cache:${Buffer.from(lastUser.content).toString("base64").slice(0, 32)}`;
  }

  getStats(): { size: number } {
    return { size: memoryCache.size };
  }
}
