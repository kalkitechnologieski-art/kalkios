import { cache } from "./redis";

interface CacheEntry {
  data: any;
  expiresAt: number;
}

// Simple in-memory fallback if redis is unavailable
const memoryCache = new Map<string, CacheEntry>();

export class ResponseCache {
  private ttl = 3600; // 1 hour

  async get(messages: any[]): Promise<any | null> {
    const key = this.buildKey(messages);

    try {
      const entry = await cache.get<CacheEntry>(key);
      if (entry && entry.expiresAt > Date.now()) {
        return entry.data;
      }
    } catch {}

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

    try {
      await cache.set(key, entry, this.ttl);
    } catch {
      memoryCache.set(key, entry);
    }
  }

  async clear(): Promise<void> {
    memoryCache.clear();
  }

  private buildKey(messages: any[]): string {
    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (!lastUser) return "cache:default";
// @ts-ignore
    return `cache:${Buffer.from(lastUser.content).toString("base64").slice(0, 32)}`;
  }

  getStats(): { size: number } {
    return { size: memoryCache.size };
  }
}
