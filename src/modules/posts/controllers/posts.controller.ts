import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

import { Post as PostModel } from '@/prisma/generated/client';
import { CreatePostDto, PostDto } from '../dtos/posts.dto';
import { PostsService } from '../services/posts.service';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1000)
  @ApiOkResponse({
    description: 'The posts have been successfully retrieved.',
    type: PostDto,
    isArray: true,
  })
  async getPosts(): Promise<PostModel[]> {
    return this.postsService.posts({});
  }

  @Get('feed')
  @UseInterceptors(CacheInterceptor)
  @ApiOkResponse({
    description: 'The published posts have been successfully retrieved.',
    type: PostDto,
    isArray: true,
  })
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postsService.posts({ where: { published: true } });
  }

  @Get('search/:searchString')
  @UseInterceptors(CacheInterceptor)
  @ApiOkResponse({
    description: 'The filtered posts have been successfully retrieved.',
    type: PostDto,
    isArray: true,
  })
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
  @ApiOkResponse({
    description: 'The post has been successfully retrieved.',
    type: PostDto,
  })
  @ApiNotFoundResponse({ description: 'The post not found.' })
  async getPostById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PostModel | null> {
    return this.postsService.post({ id });
  }

  @Post()
  @ApiCreatedResponse({
    description: 'The post has been successfully created.',
    type: PostDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'The user not found.' })
  async createDraft(@Body() createPostDto: CreatePostDto): Promise<PostModel> {
    const { title, content, authorEmail } = createPostDto;
    return this.postsService.createPost({
      title,
      content,
      author: { connect: { email: authorEmail } },
    });
  }

  @Patch(':id/publish')
  @ApiOkResponse({
    description: 'The post has been successfully published.',
    type: PostDto,
  })
  @ApiNotFoundResponse({ description: 'The post not found.' })
  async publishPost(@Param('id', ParseIntPipe) id: number): Promise<PostModel> {
    return this.postsService.updatePost({
      where: { id },
      data: { published: true },
    });
  }

  @Delete(':id')
  @ApiNoContentResponse({
    description: 'The post has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'The post not found.' })
  async deletePost(@Param('id', ParseIntPipe) id: number): Promise<PostModel> {
    return this.postsService.deletePost({ id });
  }
}
