import { Module } from '@nestjs/common';
import { PostService } from './services/post.service';

@Module({
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
