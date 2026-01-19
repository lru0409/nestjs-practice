# Versioning

> 이 내용은 HTTP 기반 애플리케이션에만 해당된다.

버전 관리를 하면 동일한 애플리케이션 내에서 컨트롤러 또는 개별 라우트의 여러 버전을 실행할 수 있다. 이전 버전을 계속 지원하면서도 호환성을 깨뜨리는 변경 사항을 적용해야 하는 경우가 종종 있다.

지원되는 버전 관리 유형은 4가지다.

- **URI Versioning** : 버전의 요청의 URI에 포함되어 전달된다. (기본값)
- **Header Versioning** : 사용자 지정 요청 헤더를 사용해 버전을 지정한다.
- **Media Type Versioning** : 요청의 Accept 헤더를 사용해 버전을 지정한다.
- **Custom Versioning** : 요청의 모든 요소를 사용해 버전을 지정할 수 있다. 해당 버전을 추출하는 사용자 지정 함수가 제공된다.

### URI 버전 관리 유형

다음과 같이 URI 버전 관리를 활성화할 수 있다.

```tsx
const app = await NestFactory.create(AppModule);
// or "app.enableVersioning()"
app.enableVersioning({
  type: VersioningType.URI,
});
await app.listen(process.env.PORT ?? 3000);
```

> URI의 버전은 기본적으로 자동으로 `v`로 시작하지만, `prefix` 키를 원하는 접두사로 설정하거나, `false`로 설정해 접두사를 비활성화할 수도 있다.

### 헤더 버전 관리 유형

다음과 같이 헤더 버전 관리를 활성화할 수 있다.

```tsx
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'Custom-Header',
});
await app.listen(process.env.PORT ?? 3000);
```

`header` 속성은 요청 버전을 포함할 헤더의 이름이어야 한다.

### Media Type 버전 관리 유형

`Accept` 헤더 내에서 버전은 세미콜론(;)으로 미디어 타입과 구분된다. 요청에 사용할 버전을 나타내는 키-값 쌍이 포함되어야 한다.

- 예: `Accept: application/json;v=2`

`key` 속성은 버전을 포함하는 키-값 쌍의 키와 구분자여야 한다.

```tsx
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v=',
});
await app.listen(process.env.PORT ?? 3000);
```

### 사용자 지정 버전 관리 유형

- 요청은 문자열 또는 문자열 배열을 반환하는 추출 함수를 사용해 분석된다.
- 요청자가 여러 버전을 제공하는 경우 추출 함수는 가장 높은 버전부터 낮은 버전 순으로 정렬된 문자열 배열을 반환할 수 있다.
    
    요청에서 버전 1, 2, 3을 지원한다고 지정한 경우, 추출기는 반드시 `[3, 2, 1]`을 반환해야 하고, 이렇게 하면 가장 높은 버전의 경로가 먼저 선택된다. 
    
    (버전 3이 존재하지 않는 경우 버전 2에 해당하는 경로가 자동으로 선택된다.)
    
- 추출 함수에서 빈 문자열이나 배열이 반환되면 일치하는 경로가 없으므로 404 오류가 반환된다.

> Express 어댑터에서는 추출 함수에서 반환된 배열을 기반으로 가장 일치하는 버전을 선택하는 방식이 안정적으로 작동하지 않으므로, 단일 버전(또는 1개 요소로 구성된 배열)을 사용해야 한다.

```tsx
const extractor = (request: FastifyRequest): string | string[] =>
  [request.headers['custom-versioning-field'] ?? '']
     .flatMap(v => v.split(','))
     .filter(v => !!v)
     .sort()
     .reverse()

const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.CUSTOM,
  extractor,
});
await app.listen(process.env.PORT ?? 3000);
```

> 애플리케이션에 버전 관리가 활성화되어 있지만 컨트롤러 또는 라우트에서 버전을 지정하지 않은 경우, 해당 컨트롤러/라우트에 대한 요청은 404 응답을 반환한다. 마찬가지로 대응하는 컨트롤러 및 라우트가 없는 버전을 포함하는 요청에도 404 응답이 반환된다.

### 컨트롤러 버전

해당 컨트롤러 내의 모든 경로에 동일한 버전을 설정할 수 있다.

```tsx
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1';
  }
}
```

### 라우트 버전

개별 경로에 버전을 적용할 수도 있다. 이 버전은 컨트롤러 버전과 같이 해당 경로에 영향을 미치는 다른 모든 버전보다 높은 우선순위를 갖는다.

```tsx
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1(): string {
    return 'This action returns all cats for version 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2(): string {
    return 'This action returns all cats for version 2';
  }
}
```

### 다중 버전

컨트롤러 또는 라우트에 여러 버전을 적용할 수도 있다. 버전을 배열로 설정하면 된다.

```tsx
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1 or 2';
  }
}
```

### 버전 “Neutral”

- 일부 컨트롤러 및 라우트는 버전에 관계없이 동일한 기능을 수행할 수 있다. 이를 위해  `VERSION_NEUTRAL` 심볼을 설정할 수 있다.
- 수신되는 요청은 요청에 포함된 버전과 관계없이, 또는 요청에 버전이 전혀 없는 경우에도 `VERSION_NEUTRAL` 컨트롤러 및 라우트로 매핑된다.

> URI 버전 관리의 경우, `VERSION_NEUTRAL` 리소스는 URI에 버전 정보가 포함되지 않는다.

```tsx
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats regardless of version';
  }
}
```

### 전역 기본 버전

버전이 지정되지 않은 모든 컨트롤러 및 라우트에 대해 특정 버전을 기본 버전으로 설정하려면 `defaultVersion`을 설정할 수 있다.

```tsx
app.enableVersioning({
  // ...
  defaultVersion: '1'
  // or
  defaultVersion: ['1', '2']
  // or
  defaultVersion: VERSION_NEUTRAL
});
```

### 미들웨어 버전 관리

미들웨어는 버전 관리 메타데이터를 사용해 특정 경로의 버전에 맞게 미들웨어를 구성할 수 있다. `MiddlewareConsumer.forRoutes()` 메서드의 매개변수 중 하나로 버전 정보를 제공하면 된다.

```tsx
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET, version: '2' });
  }
}
```

위 코드는 `LoggerMiddleware`가 `/cats` 엔드포인트의 버전 `2`에만 적용되도록 한다.

> 미들웨어는 모든 버전 관리 유형(URI, 헤더, 미디어 타입, 사용자 지정)과 함께 작동한다.