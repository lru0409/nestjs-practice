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
import { CreatePostDto } from '../dtos/posts.dto';
import { PostsService } from '../services/posts.service';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  async getPosts(): Promise<PostModel[]> {
    return this.postsService.posts({});
  }

  @Get('feed')
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postsService.posts({ where: { published: true } });
  }

  @Get('search/:searchString')
  async getFilteredPosts(
    @Param('searchString') searchString: string,
  ): Promise<PostModel[]> {
    return this.postsService.posts({
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
    return this.postsService.post({ id });
  }

  @Post()
  async createDraft(@Body() createPostDto: CreatePostDto): Promise<PostModel> {
    const { title, content, authorEmail } = createPostDto;
    return this.postsService.createPost({
      title,
      content,
      author: { connect: { email: authorEmail } },
    });
  }

  @Patch(':id/publish')
  async publishPost(@Param('id', ParseIntPipe) id: number): Promise<PostModel> {
    return this.postsService.updatePost({
      where: { id },
      data: { published: true },
    });
  }

  @Delete(':id')
  async deletePost(@Param('id', ParseIntPipe) id: number): Promise<PostModel> {
    return this.postsService.deletePost({ id });
  }
}
