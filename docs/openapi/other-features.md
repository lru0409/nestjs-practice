# Other features

### 전역 접두사

`setGlobalPrefix()`를 통해 설정된 경로에 대해 전역 접두사를 무시하려면 `ignoreGlobalPrefix`를 사용할 수 있다.

```tsx
const document = SwaggerModule.createDocument(app, options, {
  ignoreGlobalPrefix: true,
});
```

### 전역 파라미터

다음과 같이 `DocumentBuilder`를 사용해 모든 경로에 대한 매개변수를 정의할 수 있다.

```tsx
const config = new DocumentBuilder()
  .addGlobalParameters({
    name: 'tenantId',
    in: 'header',
  })
  // other configurations
  .build();
```

### 전역 응답

`DocumentBuilder`를 사용해 모든 경로에 대한 전역 응답을 정의할 수 있다. 이는 401 권한 없음, 500 내부 서버 오류와 같은 오류 코드처럼 애플리케이션의 모든 엔드포인트에서 일관된 응답을 설정하는 데 유용하다.

```tsx
const config = new DocumentBuilder()
  .addGlobalResponse({
    status: 500,
    description: 'Internal server error',
  })
  // other configurations
  .build();
```

### 여러 사양 지원

`SwaggerModule`은 여러 사양을 지원하는 방법을 제공한다. 즉 서로 다른 엔드포인트에서, 서로 다른 UI를 사용하는 다양한 문서를 제공할 수 있다.

```tsx
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CatsModule } from './cats/cats.module';
import { DogsModule } from './dogs/dogs.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();

  const catDocumentFactory = () =>
    SwaggerModule.createDocument(app, options, {
      include: [CatsModule],
    });
  SwaggerModule.setup('api/cats', app, catDocumentFactory);

  const secondOptions = new DocumentBuilder()
    .setTitle('Dogs example')
    .setDescription('The dogs API description')
    .setVersion('1.0')
    .addTag('dogs')
    .build();

  const dogDocumentFactory = () =>
    SwaggerModule.createDocument(app, secondOptions, {
      include: [DogsModule],
    });
  SwaggerModule.setup('api/dogs', app, dogDocumentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### 탐색기 바의 드롭다운 메뉴

탐색기 바의 드롭다운 메뉴에서 여러 사양을 지원하려면 `explorer: true`로 설정하고 `SwaggerCustomOptions`에서 `swaggerOptions.urls`를 구성해야 한다.

> `swaggerOptions.urls`가 Swagger 문서의 JSON 형식을 가리키는지 확인해라. JSON 문서를 지정하려면 `SwaggerCustomOptions` 내에서 `jsonDocumentUrl`을 사용해라. ([더 많은 설정 옵션 참조](https://docs.nestjs.com/openapi/introduction#setup-options))

탐색기 막대의 드롭다운 메뉴에서 여러 사양을 설정하는 방법은 다음과 같다.

```tsx
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CatsModule } from './cats/cats.module';
import { DogsModule } from './dogs/dogs.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Main API options
  const options = new DocumentBuilder()
    .setTitle('Multiple Specifications Example')
    .setDescription('Description for multiple specifications')
    .setVersion('1.0')
    .build();

  // Create main API document
  const document = SwaggerModule.createDocument(app, options);

  // Setup main API Swagger UI with dropdown support
  SwaggerModule.setup('api', app, document, {
    explorer: true,
    swaggerOptions: {
      urls: [
        {
          name: '1. API',
          url: 'api/swagger.json',
        },
        {
          name: '2. Cats API',
          url: 'api/cats/swagger.json',
        },
        {
          name: '3. Dogs API',
          url: 'api/dogs/swagger.json',
        },
      ],
    },
    jsonDocumentUrl: '/api/swagger.json',
  });

  // Cats API options
  const catOptions = new DocumentBuilder()
    .setTitle('Cats Example')
    .setDescription('Description for the Cats API')
    .setVersion('1.0')
    .addTag('cats')
    .build();

  // Create Cats API document
  const catDocument = SwaggerModule.createDocument(app, catOptions, {
    include: [CatsModule],
  });

  // Setup Cats API Swagger UI
  SwaggerModule.setup('api/cats', app, catDocument, {
    jsonDocumentUrl: '/api/cats/swagger.json',
  });

  // Dogs API options
  const dogOptions = new DocumentBuilder()
    .setTitle('Dogs Example')
    .setDescription('Description for the Dogs API')
    .setVersion('1.0')
    .addTag('dogs')
    .build();

  // Create Dogs API document
  const dogDocument = SwaggerModule.createDocument(app, dogOptions, {
    include: [DogsModule],
  });

  // Setup Dogs API Swagger UI
  SwaggerModule.setup('api/dogs', app, dogDocument, {
    jsonDocumentUrl: '/api/dogs/swagger.json',
  });

  await app.listen(3000);
}

bootstrap();
```