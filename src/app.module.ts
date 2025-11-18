import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    CatsModule,
    UserModule,
    PostModule,
    ConfigModule.forRoot(),
    PrismaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
