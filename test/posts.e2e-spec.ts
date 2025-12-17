import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaExceptionInterceptor } from '@/common/interceptors/prisma-exception.interceptor';

interface ErrorResponse {
  message: string[];
}

describe('Posts E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);

    await prisma.user.deleteMany();
    await prisma.post.deleteMany();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new PrismaExceptionInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createTestUser() {
    return prisma.user.create({
      data: { name: 'rowoon', email: 'rowoon@gmail.com' },
    });
  }

  async function createTestPost(
    title = 'title',
    content = 'content',
    published = false,
  ) {
    return prisma.post.create({
      data: {
        title,
        content,
        published,
        author: { connect: { email: 'rowoon@gmail.com' } },
      },
    });
  }

  // * GET /posts
  it('/GET posts - get all posts', async () => {
    await createTestUser();
    await createTestPost('first post');
    await createTestPost('second post');

    const response = await request(app.getHttpServer())
      .get('/posts')
      .expect(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'first post' }),
        expect.objectContaining({ title: 'second post' }),
      ]),
    );
  });

  // * GET /posts/feed
  it('/GET posts/feed - get published posts', async () => {
    await createTestUser();
    await createTestPost('draft', 'content', false);
    await createTestPost('published', 'content', true);

    const response = await request(app.getHttpServer())
      .get('/posts/feed')
      .expect(200);
    expect(response.body).toEqual([
      expect.objectContaining({ title: 'published', published: true }),
    ]);
  });

  // * GET /posts/search/:searchString
  it('/GET posts/search/:searchString - get filtered posts', async () => {
    await createTestUser();
    await createTestPost('title1');
    await createTestPost('title2');

    const response = await request(app.getHttpServer())
      .get('/posts/search/1')
      .expect(200);
    expect(response.body).toEqual([
      expect.objectContaining({ title: 'title1' }),
    ]);
  });

  // * GET /posts/:id
  it('/GET posts/:id - get a post by id', async () => {
    await createTestUser();
    const post = await createTestPost('title');
    const response = await request(app.getHttpServer())
      .get(`/posts/${post.id}`)
      .expect(200);
    expect(response.body).toMatchObject({ id: post.id, title: 'title' });
  });
  it('/GET posts/:id - not found id', async () => {
    await request(app.getHttpServer()).get('/posts/1').expect(404);
  });

  // * POST /posts
  it('/POST posts - create a post', async () => {
    await createTestUser();

    const response = await request(app.getHttpServer())
      .post('/posts')
      .send({
        title: 'title',
        content: 'content',
        authorEmail: 'rowoon@gmail.com',
      })
      .expect(201);
    expect(response.body).toMatchObject({
      title: 'title',
      content: 'content',
      published: false,
    });
  });
  it('/POST posts - validation: missing required fields', async () => {
    await createTestUser();

    const response = await request(app.getHttpServer())
      .post('/posts')
      .send({
        content: 'content',
        authorEmail: 'rowoon@gmail.com',
      })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'title is required',
    );
  });
  it('/POST posts - invalid email', async () => {
    await createTestUser();

    const response = await request(app.getHttpServer())
      .post('/posts')
      .send({
        title: 'title',
        content: 'content',
        authorEmail: 'invalid-email',
      })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'authorEmail must be a valid email',
    );
  });
  it('/POST posts - invalid content length', async () => {
    await createTestUser();

    const response = await request(app.getHttpServer())
      .post('/posts')
      .send({
        title: 'title',
        content: 'a'.repeat(501),
        authorEmail: 'rowoon@gmail.com',
      })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'content must be at most 500 characters long',
    );
  });
  it('/POST posts - non existing user', async () => {
    await createTestUser();

    await request(app.getHttpServer())
      .post('/posts')
      .send({
        title: 'title',
        content: 'content',
        authorEmail: 'unknown@gmail.com',
      })
      .expect(404);
  });

  // * PATCH /posts/:id/publish
  it('/PATCH posts/:id/publish - publish a post', async () => {
    await createTestUser();
    const post = await createTestPost('title');

    const response = await request(app.getHttpServer())
      .patch(`/posts/${post.id}/publish`)
      .expect(200);
    expect(response.body).toMatchObject({
      id: post.id,
      title: 'title',
      published: true,
    });
  });
  it('/PATCH posts/:id/publish - not found id', async () => {
    await request(app.getHttpServer()).patch('/posts/1/publish').expect(404);
  });

  // * DELETE /posts/:id
  it('/DELETE posts/:id - delete a post', async () => {
    await createTestUser();
    const post = await createTestPost('title');
    const response = await request(app.getHttpServer())
      .delete(`/posts/${post.id}`)
      .expect(200);
    expect(response.body).toMatchObject({ id: post.id, title: 'title' });

    const deleted = await prisma.post.findUnique({ where: { id: post.id } });
    expect(deleted).toBeNull();
  });
  it('/DELETE posts/:id - not found id', async () => {
    await request(app.getHttpServer()).delete('/posts/1').expect(404);
  });
});
