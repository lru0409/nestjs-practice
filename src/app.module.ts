import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { Keyv } from 'keyv';
import KeyvRedis from '@keyv/redis';

import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { RolesGuard } from './common/guards/roles.guard';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { HttpModule } from './shared/http/http.module';
import { CatsModule } from './modules/cats/cats.module';
import { UserModule } from './modules/user/user.module';
import { PostsModule } from './modules/posts/posts.module';
import { AuthModule } from './modules/auth/auth.module';

import configurationConfig from './config/configuration.config';
import timeoutConfig from './config/timeout.config';
import cacheConfig from './config/cache.config';
import httpConfig from './config/http.config';
import authenticationConfig from './config/authentication.config';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    CatsModule,
    UserModule,
    PostsModule,
    ConfigModule.forRoot({
      load: [
        configurationConfig,
        timeoutConfig,
        cacheConfig,
        httpConfig,
        authenticationConfig,
      ],
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          ttl: configService.get<number>('cache.ttl'),
          stores: [
            new Keyv({
              store: new KeyvRedis({
                url: configService.get<string>('cache.redis.url'),
              }),
            }),
          ],
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
