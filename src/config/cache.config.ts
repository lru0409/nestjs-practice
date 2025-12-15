import { registerAs } from '@nestjs/config';

const cacheConfig = registerAs('cache', () => {
  return {
    ttl: Number(process.env.CACHE_TTL ?? 30_000),
  };
});

export default cacheConfig;
