# Caching

- 캐싱은 애플리케이션 성능을 향상시키는 강력하고 간단한 기술이다.
- 임시 저장소 역할을 함으로써 자주 사용되는 데이터에 더 빠르게 접근할 수 있도록 하여 동일한 정보를 반복적으로 가져오거나 계산할 필요성을 줄여준다. → 응답 속도가 빨라지고 효율성이 향상된다.

### 설치

시작하려면 `@nestjs/cache-manager` 패키지와 `cache-manager` 패키지를 함께 설치해야 한다.

```bash
yarn add @nestjs/cache-manager cache-manager
```

- 기본적으로 모든 데이터는 메모리에 저장된다.
- `cache-manager`는 내부적으로 [Keyv](https://keyv.org/docs/)를 사용하므로, 적절한 패키지를 설치하여 Redis와 같은 고급 스토리지 솔루션으로 쉽게 전환할 수 있다.

### 인메모리 캐시

캐싱을 활성화하려면 `CacheModule`을 가져오고 `register()` 메서드를 사용해 구성해야 한다.

```tsx
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
})
export class AppModule {}
```

이 설정은 인메모리 캐싱을 기본 설정으로 초기화해 데이터를 즉시 캐싱할 수 있도록 한다.

### 캐시 저장소와 상호작용

캐시 관리자 인스턴스와 상호작용하려면 `CACHE_MANAGER` 토큰을 사용해 클래스에 주입하자.

```tsx
constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
```

> `Cache`와 `CACHE_MANAGER` 토큰은 `@nestjs/cache-manager`에서 가져온다.

- `Cache` 인스턴스에 있는 `get` 메서드는 캐시에서 항목을 가져오는 데 사용된다. 항목이 캐시에 존재하지 않으면 `null`이 반환된다.
    
    ```tsx
    const value = await this.cacheManager.get('key');
    ```
    
- 캐시에 항목을 추가하려면 `set` 메서드를 사용해야 한다.
    
    ```tsx
    await this.cacheManager.set('key', 'value');
    ```

> 인메모리 캐시 저장소에서는 [구조적 복제 알고리즘](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#javascript_types)에서 지원하는 유형의 값만 저장할 수 있다.

- 특정 키에 대한 TTL(밀리초 단위 만료 시간)을 수동으로 지정할 수 있다.
    
    ```tsx
    await this.cacheManager.set('key', 'value', 1000); // 이 경우 캐시 항목을 1초 후 만료됨
    ```
    
    캐시 만료를 비활성화하려면 TTL 구성 속성을 `0`으로 설정해야 한다.
    
    ```tsx
    await this.cacheManager.set('key', 'value', 0);
    ```
    
- 캐시에서 항목을 제거하려면 `del` 메서드를 사용해야 한다.
    
    ```tsx
    await this.cacheManager.del('key');
    ```
    
- 전체 캐시를 지우려면 `clear` 메서드를 사용해야 한다.
    
    ```tsx
    await this.cacheManager.clear();
    ```
    

### 자동 캐싱 응답

> GraphQL 애플리케이션에서 인터셉터는 각 필드 리졸버에 대해 별도로 실행된다. 따라서 인터셉터를 사용해 응답을 캐싱하는 `CacheModule`은 제대로 작동하지 않는다.

자동 캐싱 응답을 활성화하려면 데이터를 캐싱하려는 위치에 `CacheInterceptor`를 연결하기만 하면 된다.

```tsx
@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  @Get()
  findAll(): string[] {
    return [];
  }
}
```

> `GET` 엔드포인트만 캐시 가능하다. 또한 네이티브 응답 객체(`@Res()`)를 주입하는 경로는 캐시 인터셉터를 사용할 수 없다.

모든 엔드포인트에 전역적으로 `CacheInterceptor`를 바인딩할 수 있다.

```tsx
import { Module } from '@nestjs/common';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

### Time-to-live(TTL)

- `ttl`의 기본값은 `0`이며, 이는 캐시가 만료되지 않음을 의미한다.
- 사용자 지정 TTL을 지정하려면 다음과 같이 `register` 메서드에 `ttl` 옵션을 제공하면 된다.

```tsx
CacheModule.register({
  ttl: 5000, // milliseconds
});
```

### 모듈을 전역적으로 사용

- 다른 모듈에서 `CacheModule`을 사용하려면 해당 모듈을 가져오거나, 옵션 객체의 `isGlobal` 속성을 `true`로 설정해 전역 모듈로 선언할 수 있다.
- `isGlobal: true`로 설정 시, 루트 모듈에서 `CacheModule`이 로드 후 다른 모듈에서 가져올 필요가 없다.

```tsx
CacheModule.register({
  isGlobal: true,
});
```

### 전역 캐시 재정의

- 전역 캐시가 활성화된 경우, 캐시 항목은 경로에 따라 자동으로 생성되는 `CacheKey` 아래에 저장된다.
- 메서드 별로 특정 캐시 설정(`@CacheKey()` 및 `@CacheTTL()`)을 재정의하여 개발 컨트롤러 메서드에 대한 사용자 지정 캐싱 전략을 적용할 수 있다. 이는 서로 다른 캐시 저장소를 사용하는 경우 특히 유용할 수 있다.
- `@CacheTTL()` 데코레이터를 컨트롤러 별로 적용할 수 있다. 컨트롤러 수준과 메서드 수준의 캐시 TTL 설정이 모두 정의된 경우, 메서드 수준에서 지정된 캐시 TTL 설정이 컨트롤러 수준의 설정보다 우선한다.

```tsx
@Controller()
@CacheTTL(50)
export class AppController {
  @CacheKey('custom_key')
  @CacheTTL(20)
  findAll(): string[] {
    return [];
  }
}
```

> `@CacheKey()`와 `@CacheTTL()` 데코레이터는 `@nestjs/cache-manager`에서 가져온다.

- `@CacheKey()`와 `@CacheTTL()` 중 정의되지 않은 설정을 전역적으로 등록된 기본값을 사용한다.

### 웹소켓과 마이크로서비스

`CacheInterceptor`는 전송 방식과 관계없이 웹소켓 구독자뿐 아니라 마이크로서비스 패턴에도 적용할 수 있다.

```tsx
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): Observable<string[]> {
  return [];
}
```

- 단 캐시된 데이터를 저장 및 검색하는 데 사용할 키를 지정하려면 `@CacheKey()` 데코레이터를 추가로 사용해야 한다.
- 모든 것을 캐시해선 안 된다. 단순히 데이터를 조회하는 것이 아니라 비즈니스 작업을 수행하는 액션은 캐시해선 안 된다.

### 추적 설정 조정

- HTTP 앱의 경우 요청 URL을, 웹소켓 및 마이크로서비스 앱의 경우 `@CacheKey()` 데코레이터를 통해 캐시 키를 사용하여 캐시 레코드를 엔드포인트와 연결한다.
- 경우에 따라 HTTP 헤더(예: `profile` 엔드포인트를 정확하게 식별하기 위한 `Authorization` 헤더)와 같은 다른 요소를 기반으로 추적을 설정해야 할 수도 있다.
    
    이를 위해 `CacheInterceptor`의 서브 클래스를 만들고, `trackBy()` 메서드를 재정의하자.
    
    ```tsx
    @Injectable()
    class HttpCacheInterceptor extends CacheInterceptor {
      trackBy(context: ExecutionContext): string | undefined {
        return 'key';
      }
    }
    ```
    

### 다른 캐시 저장소 사용하기

다른 캐시 패키지를 설치해보자. 여기서는 Redis 패키지를 설치해본다.

```bash
yarn add @keyv/redis
```

- 아래 예제에서는 `CacheableMemory`와 `KeyvRedis`라는 두 개의 저장소를 등록한다.
- `CacheableMemory` 저장소는 간단한 인메모리 저장소이고, `KeyvRedis`는 Redis 저장소이다.
- `stores` 배열에서 첫 번째 저장소가 기본 저장소, 나머지는 대체 저장소이다.

```tsx
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new KeyvRedis('redis://localhost:6379'),
          ],
        };
      },
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

### 비동기 구성

모듈 옵션을 비동기적으로 전달해야 하는 경우, `registerAsync()` 메서드를 사용할 수 있다.

- 한 가지 방법은 팩토리 함수를 사용하는 것이다.
    
    `inject`를 통해 의존성을 주입할 수 있다.
    
    ```tsx
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get('CACHE_TTL'),
      }),
      inject: [ConfigService],
    });
    ```
    
- `useClass` 구문을 사용할 수도 있다.
    
    ```tsx
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    });
    ```
    
    `CacheConfigService`는 구성 옵션을 제공하기 위해 `CacheOptionsFactory` 인터페이스를 구현해야 한다.
    
    ```tsx
    @Injectable()
    class CacheConfigService implements CacheOptionsFactory {
      createCacheOptions(): CacheModuleOptions {
        return {
          ttl: 5,
        };
      }
    }
    ```
    
- 다른 모듈에서 가져온 기존 구성 공급자를 사용하려면 `useExisting` 구문을 사용할 수 있다.
    
    ```tsx
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useExisting: ConfigService,
    });
    ```
    
    이는 `useClass`와 동일하게 작동하지만, 자체적으로 `ConfigService`를 인스턴스화하는 대신 가져온 모듈에서 이미 생성된 `ConfigService`를 재사용한다는 차이가 있다.
    
- `registerAsync()` 메서드에 `extraProviders`라는 공급자를 전달할 수도 있다. 이러한 공급자는 모듈 공급자와 통합된다.
    
    ```tsx
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useClass: ConfigService,
      extraProviders: [MyAdditionalProvider],
    });
    ```
    
    이는 팩토리 함수나 클래스 생성자에서 추가적인 종속성을 제공하려는 경우 유용하다.