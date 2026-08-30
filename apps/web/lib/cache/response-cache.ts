import { redisClient } from "./redis";

export class ResponseCache {
  private ttl = 3600;

  async get(messages: any[]): Promise<any | null> {
    if (!redisClient) return null;
    const key = this.buildKey(messages);
    const cached = await redisClient.get(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  async set(messages: any[], response: any): Promise<void> {
    if (!redisClient) return;
    const key = this.buildKey(messages);
    await redisClient.setex(key, this.ttl, JSON.stringify(response));
  }

  private buildKey(messages: any[]): string {
    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (!lastUser) return "cache:default";
    return `cache:${Buffer.from(lastUser.content).toString("base64").slice(0, 32)}`;
  }
}
