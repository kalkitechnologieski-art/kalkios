import Redis from 'ioredis';
const REDIS_URL = process.env.REDIS_URL || '';
let redis: Redis | null = null;
try {
  if (REDIS_URL) {
    redis = new Redis(REDIS_URL);
  } else {
    console.warn('REDIS_URL not set – caching disabled');
  }
} catch (_) { console.warn('Redis initialization failed – caching disabled'); }
export const redisClient = redis;
