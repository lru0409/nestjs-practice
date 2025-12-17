import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaExceptionInterceptor } from '@/common/interceptors/prisma-exception.interceptor';

interface ErrorResponse {
  message: string[];
}

describe('User E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);

    await prisma.user.deleteMany();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new PrismaExceptionInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST user - create a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/user')
      .send({ name: 'rowoon', email: 'rowoon@gmail.com' })
      .expect(201);
    expect(response.body).toMatchObject({
      name: 'rowoon',
      email: 'rowoon@gmail.com',
    });

    const user = await prisma.user.findFirst();
    expect(user).toMatchObject({
      name: 'rowoon',
      email: 'rowoon@gmail.com',
    });
  });
  it('/POST user - conflict email check', async () => {
    await request(app.getHttpServer())
      .post('/user')
      .send({ name: 'rowoon', email: 'rowoon@gmail.com' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/user')
      .send({ name: 'sion', email: 'rowoon@gmail.com' })
      .expect(409);
  });
  it('/POST user - validation: missing required fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/user')
      .send({ email: 'rowoon@gmail.com' })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'name is required',
    );
  });
  it('/POST user - invalid email', async () => {
    const response = await request(app.getHttpServer())
      .post('/user')
      .send({ name: 'rowoon', email: 'invalid-email' })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'email must be a valid email',
    );
  });
});
