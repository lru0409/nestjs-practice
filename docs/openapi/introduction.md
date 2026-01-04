# Introduction

- OpenAPI 사양은 RESTful API를 설명하는 데 사용되는, 언어에 구애받지 않는 정의 형식이다.
- Nest는 데코레이터를 활용해 이러한 사양을 생성할 수 있는 전용 모듈을 제공한다.

### 설치

```bash
yarn add @nestjs/swagger
```

### 부트스트랩

`main.ts` 파일에서 `SwaggerModule` 클래스를 사용해 Swagger를 초기화한다.

```tsx
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> 팩토리 메서드는 `SwaggerModule.createDocument()`는 요청 시 Swagger 문서를 생성하는 데 사용된다. 생성되는 문서는 OpenAPI 문서 사양을 준수하는 직렬화 가능한 객체이다. HTTP를 통해 문서를 제공하는 대신 JSON 또는 YAML 파일로 저장해 다양한 방식으로 사용할 수도 있다.

- `DocumentBuilder`는 OpenAPI 사양을 준수하는 기본 문서를 구성하는 데 도움이 된다. 제목, 설명, 버전 등의 속성을 설정할 수 있는 여러 메서드를 제공한다.
- HTTP 경로가 정의된 전체 문서를 생성하려면 `SwaggerModule` 클래스의 `createDocument()` 메서드를 사용한다. 이 메서드는 애플리케이션 인스턴스와 Swagger 옵션 객체, 두 개의 인수를 받는다. [`SwaggerDocumentOptions`](https://docs.nestjs.com/openapi/introduction#document-options) 유형인 세 번째 인수를 제공할 수도 있다.
- 문서 생성 후에는 setup() 메서드를 호출할 수 있다. 이 메서드는 다음을 받는다.
    1. Swagger UI를 마운트할 경로
    2. 애플리케이션 인스턴스
    3. 인스턴스화된 문서 객체
    4. 선택적인 구성 매개변수 ([참조](https://docs.nestjs.com/openapi/introduction#setup-options))
- HTTP 서버를 실행 후 브라우저를 열어 http://localhost:3000/api로 이동하면 Swagger UI를 볼 수 있다.
- `SwaggerModule`은 모든 엔드포인트를 자동으로 반영한다.

> Swagger JSON 파일을 생성하고 다운로드하려면 http://localhost:3000/api-json으로 이동한다. (Swagger 문서가 http://localhost:3000/api에 있다고 가정) 다음과 같이 `setup` 메서드를 사용해 원하는 경로에 파일을 노출할 수도 있다.
> 
> ```tsx
> SwaggerModule.setup('swagger', app, documentFactory, {
>   // http://localhost:3000/swagger/json 경로에서 Swagger JSON 파일 다운로드
>   jsonDocumentUrl: 'swagger/json',
> });
> ```

> fastify와 helmet을 사용할 때 CSP에 문제가 발생할 수 있다. 이 충돌을 해결하려면 아래와 같이 CSP를 구성해라.
> 
> ```tsx
> app.register(helmet, {
>   contentSecurityPolicy: {
>     directives: {
>       defaultSrc: [`'self'`],
>       styleSrc: [`'self'`, `'unsafe-inline'`],
>       imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
>       scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
>     },
>   },
> });
> 
> // If you are not going to use CSP at all, you can use this:
> app.register(helmet, {
>   contentSecurityPolicy: false,
> });
> ```

### 문서 옵션

- 문서 생성 시 라이브러리의 동작을 메서 조정하기 위한 몇 가지 추가 옵션을 제공할 수 있다.
- 이 옵션은 `SwaggerDocumentOptions` 유형이여야 하며 다음과 같은 값을 가질 수 있다.

```tsx
export interface SwaggerDocumentOptions {
  // 문서에 포함할 모듈을 직접 지정 가능
  include?: Function[];
  // 스펙에 포함하고 싶은 DTO(Model) 클래스들을 배열로 제공
  // * 프로퍼티에서 직접 참조하지 않기 때문에 Swagger가 자동으로 스캔하지 못하는 모델 추가 시 사용
  extraModels?: Function[];
  // 문서 경로 생성 시 전역 설정된 prefix를 무시할지 여부 결정
  // * app.setGlobalPrefix('/api') 같이 전역 prefix 설정 가능
  // * @default false
  ignoreGlobalPrefix?: boolean;
  // include에서 지정한 모듈뿐 아니라 그 모듈들이 import하는 하위 모듈들의 라우트도 함께 스캔할지
  deepScanRoutes?: boolean;
  // 각 엔드포인트의 operationId가 어떻게 생성될지 커스터마이징 가능
  // * @default () => controllerKey_methodKey_version
  operationIdFactory?: OperationIdFactory;
  // Link object에서 사용되는 링크 이름을 커스터마이징 가능
  // * @see [Link objects](https://swagger.io/docs/specification/links/)
  // * @default () => `${controllerKey}_${methodKey}_from_${fieldKey}`
  linkNameFactory?: (
    controllerKey: string,
    methodKey: string,
    fieldKey: string
  ) => string;
  // 컨트롤러 이름을 기반으로 Swagger tags를 자동 생성할 지 여부 결정
  // * false로 설정하면 반드시 @ApiTags() 데코레이터를 사용 필수
  // * @default true
  autoTagControllers?: boolean;
}
```

예를 들어 라이브러리가 `UsersController_createUser` 대신 `createUser`와 같은 작업 이름을 생성하도록 하려면 다음을 설정할 수 있다.

```tsx
const options: SwaggerDocumentOptions =  {
  operationIdFactory: (
    controllerKey: string,
    methodKey: string
  ) => methodKey
};
const documentFactory = () => SwaggerModule.createDocument(app, config, options);
```

### 옵션 설정

`setup` 메서드의 네 번째 인수로 `SwaggerCustomOptions` 인터페이스를 충족하는 옵션 객체를 전달하여 Swagger UI를 구성할 수 있다.

```tsx
export interface SwaggerCustomOptions {
  // Swagger UI와 Swagger JSON/YAML 경로에도 전역 prefix를 적용할지 결정
  // * Swagger 문서 자체의 URL 경로에 prefix 붙일지 결정하는 옵션
  // * Default: `false`
  useGlobalPrefix?: boolean;
  // Swagger UI 페이지(/docs)를 보여줄지 여부 결정 (false면 JSON/YAML만 제공됨)
  // * Default: `true`
  // * deprecated 되었으므로 `ui` 옵션을 대신 사용해야 함
  swaggerUiEnabled?: boolean;
  // Swagger UI 페이지 제공 여부 결정
  ui?: boolean;
  // Swagger JSON/YAML 정의 파일 제공 여부 제어
  // * Default: `true`
  raw?: boolean | Array<'json' | 'yaml'>;
  // Swagger UI가 로드해야 할 API 정의(JSON) 파일의 URL을 직접 지정 가능
  swaggerUrl?: string;
  // Swagger JSON 문서의 노출 경로 지정
  // * Default: `<path>-json`
  jsonDocumentUrl?: string;
  // Swagger YAML 문서의 노출 경로 지정
  // * Default: `<path>-yaml`
  yamlDocumentUrl?: string;
  // 문서(JSON/YAML)를 실제 요청 시점에 동적으로 수정할 수 있는 훅
  patchDocumentOnRequest?: <TRequest = any, TResponse = any>(
    req: TRequest,
    res: TResponse,
    document: OpenAPIObject
  ) => OpenAPIObject;
  // Swagger UI에서 여러 문서(OpenAPI 파일)를 선택할 수 있는 드롭다운을 표시할지 여부
  // * Default: `false`
  explorer?: boolean;
  // Swagger UI의 동작을 세부 커스터마이징
  swaggerOptions?: SwaggerUiOptions;
  // Swagger UI에 직접 CSS string을 삽입 가능
  customCss?: string;
  // 외부 CSS 파일 URL을 UI에 추가해 스타일 변경 가능
  customCssUrl?: string | string[];
  // 외부 JavaScript 파일 URL 삽입 가능
  customJs?: string | string[];
  // JS 코드를 직접 인라인으로 삽입 가능
  customJsStr?: string | string[];
  // Swagger UI 페이지의 favicon 변경
  customfavIcon?: string;
  // Swagger UI 페이지의 HTML <title> 변경
  customSiteTitle?: string;
  // Swagger UI를 구성하는 정적 파일(./node_modules/swagger-ui-dist)을 커스텀 경로에서 불러오기
  customSwaggerUiPath?: string;
}
```