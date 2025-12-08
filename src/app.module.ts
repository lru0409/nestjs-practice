import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaModule } from './prisma/prisma.module';
import { CatsModule } from './modules/cats/cats.module';
import { UserModule } from './modules/user/user.module';
import { PostsModule } from './modules/posts/posts.module';

@Module({
  imports: [
    PrismaModule,
    CatsModule,
    UserModule,
    PostsModule,
    ConfigModule.forRoot(),
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
