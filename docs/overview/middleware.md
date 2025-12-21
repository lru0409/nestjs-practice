# Middleware

- 경로 핸들러보다 먼저 호출되는 함수
- 요청 및 응답 객체와 애플리케이션의 요청-응답 주기에서 `next()` 미들웨어 함수에 접근할 수 있음

> **Express 공식 문서에서 설명하는 미들웨어 기능**
> 
> - 모든 코드를 실행합니다.
> - 요청 및 응답 객체를 변경합니다.
> - 요청-응답 주기를 종료합니다.
> - 스택에서 다음 미들웨어 함수를 호출합니다.
> - 현재 미들웨어 함수가 요청-응답 주기를 종료하지 않으면 다음 미들웨어 함수로 제어권을 넘기기 위해 `next()`를 호출해야 합니다. 그렇지 않으면 요청은 중단 상태로 남게 됩니다.
- 사용자 지정 Nest 미들웨어는 함수 또는 `@Injectable()` 데코레이터가 있는 클래스에서 구현함
- 클래스는 `NestMiddleware` 인터페이스를 구현해야 하지만, 함수에는 특별한 요구사항이 없음
    
    ```tsx
    // logger.middleware.ts
    
    import { Injectable, NestMiddleware } from '@nestjs/common';
    import { Request, Response, NextFunction } from 'express';
    
    @Injectable()
    export class LoggerMiddleware implements NestMiddleware {
      use(req: Request, res: Response, next: NextFunction) {
        console.log('Request...');
        next();
      }
    }
    ```
    

### 종속성 주입

- Nest 미들웨어는 의존성 주입을 완벽하게 지원함
- 마찬가지로 동일한 모듈 내에서 사용 가능한 종속성을 주입할 수 있고, 이는 일반적으로 생성자를 통해 수행됨

### 미들웨어 적용

- 모듈 클래스의 `configure()` 메서드를 사용하여 미들웨어 설정 가능
- 미들웨어를 포함하는 모듈은 `NestModule` 인터페이스를 구현해야 함

```tsx
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware) // LoggerMiddleware를
      .forRoutes('cats'); // `/cats`로 시작하는 모든 라우트에 적용하라
  }
}
```

- 특정 HTTP Method에만 미들웨어를 적용할 수도 있음
    
    ```tsx
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
    ```
    
- `configure()` 자체를 async로 만들어 외부 설정에 따라 미들웨어를 동적으로 적용할 수 있음
    
    ```tsx
    async configure(consumer: MiddlewareConsumer) {
      const isEnabled = await fetchConfig();
      if (isEnabled) {
        consumer.apply(MyMiddleware).forRoutes('*');
      }
    }
    ```

> NestJS는 express 환경에서 body-parser의 json/urlencoded 미들웨어를 자동으로 등록한다. 만약 이 미들웨어를 직접 조절하고 싶으면, Nest 앱 생성 시 bodyParser를 꺼야 한다.
> 
> ```tsx
> NestFactory.create(AppModule, { bodyParser: false });
> ```
> 
> 그리고 나서 `configure()`에서 직접 등록할 수 있다.
>
> ```tsx
> consumer
>  .apply(express.json({ limit: '50mb' }))
>  .forRoutes('*');
>```

### 경로 와일드카드

- 패턴 기반 경로도 지원됨.
- 명명된 와일드카드를 사용해 경로의 모든 문자 조합을 일치시킬 수 있음

```tsx
  .forRoutes({
    path: 'abcd/*splat', // abcd/로 시작하고 뒤에 어떤 문자열이 와도 이 미들웨어가 실행됨
    method: RequestMethod.ALL,
  });
```

- `abcd/*`는 `abcd/` 자체는 매칭하지 않음 → `abcd/` 자체도 매칭되도록 하려면 `{}`로 감싸서 optional wildcard로 만들어야 함
    - `path: 'abcd/{*splat}'`

### 미들웨어 consumer

- `MiddlewareConsumer`는 도우미 클래스로, 미들웨어를 관리하기 위한 여러 내장 메서드를 제공함
- `apply()` 메서드에는 단일 미들웨어 또는 여러 개의 미들웨를 전달할 수 있음
- `forRoutes()` 메서드에는 단일 문자열, 여러 문자열, `RouteInfo` 객체, 컨트롤러 클래스, 심지어 여러 컨트롤러 클래스를 전달할 수도 있음
    - 대부분의 경우 쉼표로 구분된 컨트롤러 클래스 목록을 전달하면 됨

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
      .forRoutes(CatsController);
  }
}
```

### 경로 제외

- 특정 경로를 미들웨어 적용에서 제외해야 할 수 있는데, 이는 `exclude()` 메서드를 사용해 쉽게 구현 가능
- `exclude()` 메서드는 제외할 경로 식별을 위해 단일 문자열, 여러 문자열, 또는 `RouteInfo` 객체를 받음

```tsx
consumer
  .apply(LoggerMiddleware)
  .exclude(
    { path: 'cats', method: RequestMethod.GET },
    { path: 'cats', method: RequestMethod.POST },
    'cats/{*splat}',
  )
  .forRoutes(CatsController);
```

### 함수형 미들웨어

로거 미들웨어를 클래스 기반에서 함수형 미들웨어로 변환할 수 있음

```tsx
import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`Request...`);
  next();
};
```

그리고 `AppModule`에서 이렇게 사용하면 됨

```tsx
consumer
  .apply(logger)
  .forRoutes(CatsController);
```

> 미들웨어에 종속성이 필요하지 않은 경우에는 보다 간단한 함수형 미들웨어 사용을 고려해라.

### 다중 미들웨어

순차적으로 실행되는 여러 미들웨어를 바인딩하려면 `apply()` 메서드에 쉼표로 구분된 목록을 제공하면 됨

```tsx
consumer.apply(cors(), helmet(), logger).forRoutes(CatsController);
```

### 전역 미들웨어

등록된 모든 경로에 미들웨어를 한 번에 바인딩하려면 `INestApplication` 인스턴스에서 제공하는 `use()` 메서드를 사용하면 됨

```tsx
const app = await NestFactory.create(AppModule);
app.use(logger);
await app.listen(process.env.PORT ?? 3000);
```

> 전역 미들웨어에서는 DI 컨테이너에 접근할 수 없다. `app.use()` 대신 함수형 미들웨어를 사용할 수 있고, 또는 클래스 미들웨어를 사용하고 `AppModule` 내에서 `.forRoutes(’*’)`로 등록할 수도 있다.