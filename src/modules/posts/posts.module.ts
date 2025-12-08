import { Module } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { PostsController } from './controllers/posts.controller';
import { PostsService } from './services/posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
})
export class PostsModule {}
