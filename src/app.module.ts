import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { RolesGuard } from './common/guards/roles.guard';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { HttpModule } from './shared/http/http.module';
import { CatsModule } from './modules/cats/cats.module';
import { UserModule } from './modules/user/user.module';
import { PostsModule } from './modules/posts/posts.module';

import configurationConfig from './config/configuration.config';
import timeoutConfig from './config/timeout.config';
import cacheConfig from './config/cache.config';
import httpConfig from './config/http.config';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    CatsModule,
    UserModule,
    PostsModule,
    ConfigModule.forRoot({
      load: [configurationConfig, timeoutConfig, cacheConfig, httpConfig],
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get<number>('cache.ttl'),
      }),
      inject: [ConfigService],
    }),
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
