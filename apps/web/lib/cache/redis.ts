import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "";

let redis: Redis | null = null;

if (REDIS_URL) {
  try {
    redis = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
  } catch (e) {
    console.warn("Redis connection failed, caching disabled.", e);
    redis = null;
  }
} else {
  console.warn("REDIS_URL not set, caching disabled.");
}

export const redisClient = redis;
