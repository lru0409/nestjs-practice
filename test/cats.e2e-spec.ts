import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';

import { CatsModule } from '@/src/modules/cats/cats.module';

interface ErrorResponse {
  message: string[];
}

interface SuccessResponse {
  name: string;
  age: number;
  breed: string;
}

describe('Cats E2E', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CatsModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST cats - create a cat', async () => {
    const response = await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'nabi', age: 2, breed: 'persian' })
      .expect(201);
    expect(response.body).toEqual({ name: 'nabi', age: 2, breed: 'persian' });
  });
  it('/POST cats - conflict name check', async () => {
    await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'nabi', age: 2, breed: 'persian' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'nabi', age: 3, breed: 'mix' })
      .expect(409);
  });
  it('/POST cats - validation: missing required fields', async () => {
    const response: Response = await request(app.getHttpServer())
      .post('/cats')
      .send({ age: 2, breed: 'persian' })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'name is required',
    );
  });
  it('/POST cats - validation: invalid type', async () => {
    const response = await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'nabi', age: '2', breed: 'persian' })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'age must be an integer',
    );
  });
  it('/POST cats - validation: age is negative', async () => {
    const response = await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'nabi', age: -1, breed: 'persian' })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'age must be zero or a positive integer',
    );
  });
  it('/POST cats - validation: name length is too short', async () => {
    const response = await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'n', age: 2, breed: 'persian' })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'name must be at least 2 characters long',
    );
  });

  it('/GET cats - get all cats', async () => {
    await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'nabi', age: 2, breed: 'persian' })
      .expect(201);
    const response = await request(app.getHttpServer())
      .get('/cats')
      .expect(200);
    expect(response.body).toEqual([{ name: 'nabi', age: 2, breed: 'persian' }]);
  });

  it('/GET casts/:name - get a cat by name', async () => {
    await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'nabi', age: 2, breed: 'persian' })
      .expect(201);
    const response = await request(app.getHttpServer())
      .get('/cats/nabi')
      .expect(200);
    expect(response.body).toEqual({ name: 'nabi', age: 2, breed: 'persian' });
  });
  it('/GET cats/:name - not found', async () => {
    await request(app.getHttpServer()).get('/cats/unknown').expect(404);
  });

  it('/PATCH cats/:name - update a cat', async () => {
    await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'nabi', age: 2, breed: 'persian' })
      .expect(201);
    const response = await request(app.getHttpServer())
      .patch('/cats/nabi')
      .send({ age: 5 })
      .expect(200);
    expect((response.body as SuccessResponse).age).toBe(5);
  });
  it('/PATCH cats/:name - conflict name check', async () => {
    await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'nabi', age: 2, breed: 'persian' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'choco', age: 3, breed: 'mix' })
      .expect(201);
    await request(app.getHttpServer())
      .patch('/cats/choco')
      .send({ name: 'nabi' })
      .expect(409);
  });
  it('/PATCH cats/:name - not found', async () => {
    await request(app.getHttpServer())
      .patch('/cats/unknown')
      .send({ age: 5 })
      .expect(404);
  });
  it('/PATCH cats/:name - validation: invalid type', async () => {
    const response = await request(app.getHttpServer())
      .patch('/cats/nabi')
      .send({ age: '5' })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'age must be an integer',
    );
  });
  it('/PATCH cats/:name - validation: age is negative', async () => {
    const response = await request(app.getHttpServer())
      .patch('/cats/nabi')
      .send({ age: -1 })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'age must be zero or a positive integer',
    );
  });
  it('/PATCH cats/:name - validation: name length is too short', async () => {
    const response = await request(app.getHttpServer())
      .patch('/cats/nabi')
      .send({ name: 'n' })
      .expect(400);
    expect((response.body as ErrorResponse).message).toContain(
      'name must be at least 2 characters long',
    );
  });

  it('/DELETE cats/:name - delete a cat', async () => {
    await request(app.getHttpServer())
      .post('/cats')
      .send({ name: 'nabi', age: 2, breed: 'persian' })
      .expect(201);
    await request(app.getHttpServer()).delete('/cats/nabi').expect(204);
    await request(app.getHttpServer()).get('/cats/nabi').expect(404);
  });
  it('/DELETE cats/:name - not found', async () => {
    await request(app.getHttpServer()).delete('/cats/nabi').expect(404);
  });
});
