import { redisClient } from './redis';
export class ResponseCache {
  private ttl = { search: 3600, chat: 300 };
  async get(messages: any[]): Promise<any | null> {
    if (!redisClient) return null;
    const key = this.getKey(messages);
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
    return null;
  }
  async set(messages: any[], value: any): Promise<void> {
    if (!redisClient) return;
    const key = this.getKey(messages);
    await redisClient.setex(key, this.ttl.chat, JSON.stringify(value));
  }
  private getKey(messages: any[]): string {
    const last = messages[messages.length - 1]?.content || '';
    return `chat:${Buffer.from(last).toString('base64').slice(0, 50)}`;
  }
}
