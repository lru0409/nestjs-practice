import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';

import { Post as PostModel } from '@/prisma/generated/client';
import { PostsService } from '../services/posts.service';

@Controller('posts')
export class PostsController {
  constructor(private postService: PostsService) {}

  @Get()
  async getPosts(): Promise<PostModel[]> {
    return this.postService.posts({});
  }

  @Get('feed')
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postService.posts({ where: { published: true } });
  }

  @Get('search/:searchString')
  async getFilteredPosts(
    @Param('searchString') searchString: string,
  ): Promise<PostModel[]> {
    return this.postService.posts({
      where: {
        OR: [
          { title: { contains: searchString } },
          { content: { contains: searchString } },
        ],
      },
    });
  }

  @Get(':id')
  async getPostById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PostModel | null> {
    return this.postService.post({ id });
  }

  @Post()
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData;
    return this.postService.createPost({
      title,
      content,
      author: { connect: { email: authorEmail } },
    });
  }

  @Patch(':id/publish')
  async publishPost(@Param('id', ParseIntPipe) id: number): Promise<PostModel> {
    return this.postService.updatePost({
      where: { id },
      data: { published: true },
    });
  }

  @Delete(':id')
  async deletePost(@Param('id', ParseIntPipe) id: number): Promise<PostModel> {
    return this.postService.deletePost({ id });
  }
}
