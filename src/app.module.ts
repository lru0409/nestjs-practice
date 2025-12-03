import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { RolesGuard } from './common/guards/roles.guard';
import { CatsModule } from './modules/cats/cats.module';
import { UserModule } from './modules/user/user.module';
import { PostModule } from './modules/posts/posts.module';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    CatsModule,
    UserModule,
    PostModule,
    ConfigModule.forRoot(),
    PrismaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
