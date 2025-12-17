import { registerAs } from '@nestjs/config';

const cacheConfig = registerAs('cache', () => {
  return {
    ttl: Number(process.env.CACHE_TTL ?? 30_000),
    redis: {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    },
  };
});

export default cacheConfig;
