# Rate limiting

- rate-limiting은 무차별 대입 공격으로부터 애플리케이션을 보호하는 일반적인 기술이다.
- 시작하려면 `@nestjs/throttler` 패키지를 설치한다.
    
    ```bash
    yarn add @nestjs/throttler
    ```
    
- `ThrottlerModule`을 `forRoot` 또는 `forRootAsync` 메서드를 사용해 구성할 수 있다.
    
    ```tsx
    // app.module.ts
    
    @Module({
      imports: [
         ThrottlerModule.forRoot({
          throttlers: [
            {
              ttl: 60000,
              limit: 10,
            },
          ],
        }),
      ],
    })
    export class AppModule {}
    ```
    
    - 위 설정은 애플리케이션에서 보호되는 경로에 대해 `ttl`(Time to Live)과 `limit`(TTL 내 최대 요청 수)에 대한 전역 옵션을 설정한다.
    - 모듈을 임포트한 후에 `ThrottlerGuard`를 바인딩할 수 있다. 가드를 전역적으로 바인딩하려면 다음과 같이 등록하자.
    
    ```tsx
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
    ```
    

### 다중 Throttler 정의

- 경우에 따라 초당 3회 호출, 10초당 20회 호출, 1분당 100회 호출과 같이 여러 호출 제한 조건을 설정해야 할 수 있다.
- 이를 위해 명명된 옵션들을 배열에 저장하고, 나중에 `@SkipThrottle()` 및 `@Throttle()` 데코레이터를 사용해 해당 옵션을 변경할 수 있다.

```tsx
// app.module.ts

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
  ],
})
export class AppModule {}
```

### 사용자 정의

- 컨트롤러 또는 전역적으로 가드를 바인딩하되, 하나 이상의 엔드포인트에 대해선 rate-limiting을 비활성화하고 싶은 경우가 있을 수 있다. 이 경우 `@SkipThrottle()` 데코레이터를 사용해 trottler를 비활성화할 수 있다.
- `@SkipThrottle()` 데코레이터는 문자열 키와 부울 값으로 구성된 객체를 인수로 받을 수 있다. 이는 throttler가 여러 개인 경우 각 throttler 세트별로 설정을 구성하려는 경우 유용하다. 객체를 전달하지 않으면 기본값인 `{ default: true }`가 사용된다.
    
    ```tsx
    @SkipThrottle()
    @Controller('users')
    export class UsersController {}
    ```
    
- `@SkipThrottle()` 데코레이터는 경로 또는 클래스를 건너뛰거나, 건너뛴 클래스 내의 경로 건너뛰기를 해제하는 데 사용할 수 있다.
    
    ```tsx
    @SkipThrottle()
    @Controller('users')
    export class UsersController {
      // Rate limiting is applied to this route.
      @SkipThrottle({ default: false })
      dontSkip() {
        return 'List users work with Rate limiting.';
      }
      // This route will skip rate limiting.
      doSkip() {
        return 'List users work without Rate limiting.';
      }
    }
    ```
    
- 또한 `@Throttle()` 데코레이터를 사용해 전역 모듈에 설정된 `ttl`과 `limit`를 재정의하여 더 엄격하거나 완화된 보안 옵션을 제공할 수 있다.
- 버전 5 이상에서는 `@Throttle()` 데코레이터가 설정의 이름을 나타내는 문자열과 옵션 객체를 매개변수로 받는다. 원래 옵션에 이름이 설정되어 있지 않은 경우 “default” 문자열을 사용하면 된다.
    
    ```tsx
    // Override default configuration for Rate limiting and duration.
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    @Get()
    findAll() {
      return "List users works with custom rate limiting.";
    }
    ```
    

### 프록시

- 애플리케이션이 프록시 서버 뒤에서 실행되는 경우, HTTP 어댑터가 프록시를 신뢰하도록 구성하는 것이 필수적이다.
- Express 및 Fastify의 특정 HTTP 어댑터 옵션을 참조해 프록시 신뢰 설정을 활성화할 수 있다.

```tsx
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  await app.listen(3000);
}

bootstrap();
```

- `trust proxy`를 활성화하면 `X-Forwarded-For` 헤더에서 원래 IP 주소를 가져올 수 있다.
- `getTracker()` 메서드를 재정의하여 `req.ip`에 의존하는 대신 이 헤더에서 IP 주소를 추출하도록 애플리케이션의 동작을 사용자 지정할 수 있다.
    
    ```tsx
    // throttler-behind-proxy.guard.ts
    import { ThrottlerGuard } from '@nestjs/throttler';
    import { Injectable } from '@nestjs/common';
    
    @Injectable()
    export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
      protected async getTracker(req: Record<string, any>): Promise<string> {
        return req.ips.length ? req.ips[0] : req.ip; // individualize IP extraction to meet your own needs
      }
    }
    ```
    

### 웹 소켓

이 모듈은 웹소켓과 연동할 수 있지만 일부 클래스 확장이 필요하다. `ThrottlerGuard`를 확장하고 `handleRequest` 메서드를 다음과 같이 재정의할 수 있다.

```tsx
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const {
      context,
      limit,
      ttl,
      throttler,
      blockDuration,
      getTracker,
      generateKey,
    } = requestProps;

    const client = context.switchToWs().getClient();
    const tracker = client._socket.remoteAddress;
    const key = generateKey(context, tracker, throttler.name);
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttler.name,
      );

    const getThrottlerSuffix = (name: string) =>
      name === 'default' ? '' : `-${name}`;

    // Throw an error when the user reached their limit.
    if (isBlocked) {
      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      });
    }

    return true;
  }
}
```

- 웹소켓 사용 시 몇 가지 유의해야 할 사항이 있다.
    - Guard는 `APP_GUARD` 또는 `app.useGlobalGuards()`에 등록할 수 없다.
    - 제한에 도달하면 Nest에서 `exception` 이벤트를 발생시키므로 이 이벤트를 수신할 수 있는 리스너를 준비해야 한다.

### GraphQL

- `ThrottlerGuard`는 GraphQL 요청 처리에도 사용할 수 있다.
- 가드를 확장하여 `getRequestResponse` 메서드를 재정의해야 한다.

```tsx
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }
}
```

### 구성

`ThrottlerModule`의 옵션 배열에 전달된 객체에 대해 다음 옵션들이 유효하다.

| 옵션                 | 설명                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------- |
| `name`             | 사용 중인 throttler 셋을 내부적으로 추적하기 위한 이름 (전달하지 않으면 `default` 사용)                           |
| `ttl`              | 각 요청이 저장소에 머무르는 시간 (밀리초)                                                              |
| `limit`            | TTL 기간 내 허용되는 최대 요청 수                                                                 |
| `blockDuration`    | `limit` 초과 시 요청이 차단되는 시간 (밀리초)                                                        |
| `ignoreUserAgents` | 스로틀링을 적용하지 않을 User-Agent의 정규식 배열                                                      |
| `skipIf`           | `ExecutionContext`를 받아 스로틀러 로직을 건너뛸지 결정하는 함수 (`@SkipThrottle()`과 유사하지만 요청 조건 기반으로 동작) |


모든 스로틀러 셋에 공통 적용할 수 있는 전역 옵션은 다음과 같은 것들이 있다.

| 옵션                 | 설명                                                                               |
| ------------------ | -------------------------------------------------------------------------------- |
| `storage`          | 스로틀링 상태를 저장할 스토리지 서비스 (기본: 메모리). 서버가 여러 대라면 Redis 사용 권장                          |
| `ignoreUserAgents` | 스로틀링을 적용하지 않을 User-Agent의 정규식 배열                                                 |
| `skipIf`           | `ExecutionContext`를 받아 스로틀러 로직을 건너뛸지 결정하는 함수                                     |
| `throttlers`       | 위에서 정의한 throttler 셋들의 배열                                                         |
| `errorMessage`     | 기본 스로틀러 오류 메시지를 재정의하는 문자열 또는 함수                                                  |
| `getTracker`       | `Request`를 받아 요청을 식별할 tracker 문자열을 반환하는 함수                                       |
| `generateKey`      | `ExecutionContext`, tracker, throttler 이름을 받아 rate limit 저장에 사용할 최종 key를 생성하는 함수 |


### 비동기 구성

- rate-limiting 구성을 비동기 방식으로 가져오고 싶은 경우, 의존성 주입과 비동기 메서드를 지원하는 `forRootAsync()` 메서드를 사용할 수 있다.
- 한 가지 방법은 팩토리 함수를 사용하는 것이다.
    
    ```tsx
    @Module({
      imports: [
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => [
            {
              ttl: config.get('THROTTLE_TTL'),
              limit: config.get('THROTTLE_LIMIT'),
            },
          ],
        }),
      ],
    })
    export class AppModule {}
    ```
    
- `useClass` 문법을 사용할 수도 있다.
    
    ```tsx
    @Module({
      imports: [
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          useClass: ThrottlerConfigService,
        }),
      ],
    })
    export class AppModule {}
    ```
    
    `ThrottlerOptionsService`가 `ThrottlerOptionsFactory` 인터페이스를 구현하는 한 이는 가능하다.
    

### 스토리지

- 내장 스토리지는 TTL이 경과할 때까지 요청을 추적하는 메모리 캐시다.
- 클래스가 `ThrottlerStorage` 인터페이스를 구현하는 한 `ThrottlerModule`의 `storage` 옵션에서 사용자 지정 스토리지 옵션을 추가할 수 있다.
- 분산 서버의 경우 단일 소스(Single Source of Truth)를 유지하기 위해 Redis 용 커뮤니티 스토리지 공급자를 사용할 수 있다.

### Time 헬퍼

- 시간을 더 읽기 쉽게 만들어주는 몇 가지 도우미 메서드가 있다.
- `@nestjs/throttler`는 `seconds`, `minutes`, `hours`, `days`, `weeks`의 다섯 가지 헬퍼 메서드를 제공한다.
- `seconds(5)` 또는 다른 헬퍼 메서드를 호출하기만 하면 정확한 밀리초 값이 반환된다.
- (`@nestjs/throttler`에서 시간 단위를 전부 밀리초로 사용하기 때문에 필요함)
