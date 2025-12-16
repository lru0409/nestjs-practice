import { registerAs } from '@nestjs/config';

const httpConfig = registerAs('http', () => {
  return {
    timeout: Number(process.env.HTTP_TIMEOUT) || 5000,
    retry: {
      count: Number(process.env.HTTP_RETRY_COUNT) || 3,
      jitterMs: Number(process.env.HTTP_RETRY_JITTER_MS) || 300,
    },
  };
});

export interface HttpConfig {
  timeout: number;
  retry: {
    count: number;
    jitterMs: number;
  };
}

export default httpConfig;
