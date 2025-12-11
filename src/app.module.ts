import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { RolesGuard } from './common/guards/roles.guard';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { CatsModule } from './modules/cats/cats.module';
import { UserModule } from './modules/user/user.module';
import { PostsModule } from './modules/posts/posts.module';
import configurationConfig from './config/configuration.config';
import timeoutConfig from './config/timeout.config';

@Module({
  imports: [
    PrismaModule,
    CatsModule,
    UserModule,
    PostsModule,
    ConfigModule.forRoot({
      load: [configurationConfig, timeoutConfig],
      isGlobal: true,
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
