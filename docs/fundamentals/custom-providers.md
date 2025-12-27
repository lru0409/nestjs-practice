# Custom providers

### DI 기본 사항

의존성 주입은 제어 역전(IoC) 기법으로, 직접 코드를 사용하여 인스턴스화를 수행하는 대신 IoC 컨테이너(이 경우 NestJS 런타임 시스템)에 위임한다.

1. 먼저 공급자를 정의한다. `@Injectable()` 데코레이터를 사용해 공급자임을 표시한다.
    
    ```tsx
    import { Injectable } from '@nestjs/common';
    import { Cat } from './interfaces/cat.interface';
    
    @Injectable()
    export class CatsService {
      private readonly cats: Cat[] = [];
    
      findAll(): Cat[] {
        return this.cats;
      }
    }
    ```
    
    - `@Injectable()` 데코레이터는 클래스를 Nest IoC 컨테이너에서 관리할 수 있는 클래스로 선언함
2. Nest가 공급자를 컨트롤러 클래스에 주입하도록 요청한다.
    
    ```tsx
    import { Controller, Get } from '@nestjs/common';
    import { CatsService } from './cats.service';
    import { Cat } from './interfaces/cat.interface';
    
    @Controller('cats')
    export class CatsController {
      constructor(private catsService: CatsService) {}
    
      @Get()
      async findAll(): Promise<Cat[]> {
        return this.catsService.findAll();
      }
    }
    ```
    
    - `CatsController`는 생성자 주입을 통해 `CatsService` 토큰에 대한 종속성을 선언함
3. Nest IoC 컨테이너에 공급자를 등록한다.
    
    ```tsx
    import { Module } from '@nestjs/common';
    import { CatsController } from './cats/cats.controller';
    import { CatsService } from './cats/cats.service';
    
    @Module({
      controllers: [CatsController],
      providers: [CatsService],
    })
    export class AppModule {}
    ```
    
    - `app.module.ts`에서 `CatsService` 토큰을 `cats.service.ts` 파일의 `CatsService` 클래스와 연결함
    - Nest IoC 컨테이너가 `CatsController`를 인스턴스화할 때 `CatsService` 종속성을 찾음. `CatsService` 토큰을 조회해 `CatsService` 클래스를 반환함. 싱글톤 범위(기본 동작)를 가정하면 Nest는 `CatsService` 인스턴스를 생성하고 캐시하여 반환하거나, 이미 캐시된 인스턴스가 있는 경우 기존 인스턴스를 반환함
- 코드의 종속성을 분석하는 프로세스는 애플리케이션 부트스트래핑 중에 수행된다.
- 종속성 분석은 전이적이다. 종속성 그래프는 종속성이 올바른 순서, 즉 “상향식”으로 해결되도록 보장한다. 이 메커니즘은 개발자가 이처럼 복잡한 종속성 그래프를 관리할 필요가 없도록 해준다.

### 표준 공급자

`providers` 속성은 제공자 배열을 받는다. 클래스 이름 목록을 통해 제공자를 제공할 수 있는데, 이는 더 완전한 구문을 축약한 것이다.

```tsx
providers: [CatsService],
```

```tsx
providers: [
  {
    provide: CatsService,
    useClass: CatsService,
  },
];
```

`CatsService` 토큰을 `CatsService` 클래스와 명확하게 연관시키고 있다. 축약 표기법은 토큰을 사용해 동일한 이름의 클래스 인스턴스를 요청하기 위한 편의적인 표현이다.

### 사용자 지정 공급자

- 표준 공급자가 제공하는 범위를 벗어나는 요구 사항이 있다.
    - Nest에서 클래스를 인스턴스화하거나 캐시된 인스턴스를 반환하는 대신 사용자 지정 인스턴스를 생성하려는 경우
    - 두 번째 종속성에서 기존 클래스를 재사용하려는 경우
    - 테스트를 위해 모의 버전으로 클래스를 재정의하려는 경우
- 위의 경우를 처리하기 위해 사용자 지정 공급자를 정의할 수 있는 여러 가지 방법이 있다. 살펴보자.

### **값 공급자:** `useValue`

- `useValue` 구문을 상수 값을 주입하거나, 외부 라이브러리를 Nest 컨테이너에 추가하거나, 실제 구현을 모의 객체로 대체하는 데 유용하다.
    
    (`useClass`는 Nest가 클래스를 직접 `new` 해서 인스턴스 생성하는 반면, `useValue` 사용 시 객체 그대로를 값으로 주입함)
    
- 예를 들어 Nest가 테스트 목적으로 모의 `CatsService`를 사용도록 강제하고 싶다고 가정해보자.

```tsx
import { CatsService } from './cats.service';

const mockCatsService = {
  /* mock implementation
  ...
  */
};

@Module({
  imports: [CatsModule],
  providers: [
    {
      provide: CatsService,
      useValue: mockCatsService,
    },
  ],
})
export class AppModule {}
```

- 이 예에서 `CatsService` 토큰은 `mockCatsService` 모의 객체로 확인된다.
- `CatsService` 클래스와 동일한 인터페이스를 가진 리터럴 객체를 `useValue` 값으로 전달했다.
    
    TypeScript의 구조적 타이핑 덕분에 리터럴 객체나 `new`로 인스턴스화된 클래스 인스턴스를 포함해 호환되는 인터페이스를 가진 모든 객체를 사용할 수 있다.
    

### 클래스 기반이 아닌 공급자 토큰

- 지금까지 공급자 토큰으로 클래스 이름(공급자 배열에 나열된 공급자의 provide 속성 값)을 사용해왔다.
- 경우에 따라 문자열이나 기호를 DI 토큰으로 사용할 수 있는 유연성이 필요할 수 있다. 예를 들면:
    
    ```tsx
    import { connection } from './connection';
    
    @Module({
      providers: [
        {
          provide: 'CONNECTION',
          useValue: connection,
        },
      ],
    })
    export class AppModule {}
    ```
    
    문자열 값 토큰(`’CONNECTION’`)을 `connection` 객체와 연결함

> 문자열 외에도 JavaScript 심볼이나 TypeScript 열거형을 토큰 값으로 사용할 수 있다. 

- 사용자 지정 공급자를 주입하기 위해서는 `@Inject()` 데코레이터를 사용해야 한다. 이 데코레이터는 토큰을 단일 인수로 받는다.
    
    ```tsx
    @Injectable()
    export class CatsRepository {
      constructor(@Inject('CONNECTION') connection: Connection) {}
    }
    ```

> 위 예제는 `‘CONNECTION’` 문자열을 직접 사용했지만, 깔끔한 코드 구성을 위해서는 `constants.ts` 같은 별도 파일에 토큰을 정의하는 것이 가장 좋다.

### 클래스 공급자: `useClass`

- `useClass` 구문을 사용하면 클래스를 동적으로 결정할 수 있다.
- 예를 들어 `ConfigService` 클래스가 있다고 가정하고, 현재 환경에 따라 다른 구성 서비스 구현을 제공하도록 설정하고자 한다면:
    
    ```tsx
    const configServiceProvider = {
      provide: ConfigService,
      useClass:
        process.env.NODE_ENV === 'development'
          ? DevelopmentConfigService
          : ProductionConfigService,
    };
    
    @Module({
      providers: [configServiceProvider],
    })
    export class AppModule {}
    ```
    
    `ConfigService`에 의존하는 모든 클래스에 대해 Nest는 제공된 클래스(`DevelopmentConfigService` 또는 `ProductionConfigService`)의 인스턴스를 주입해 다른 곳에서 선언되었을 수 있는 기본 구현(예: `@Injectable()` 데코레이터로 선언된 `ConfigService`)을 재정의한다.
    

### 팩토리 공급자: `useFactory`

- `useFactory` 구문을 사용하면 공급자를 동적으로 생성할 수 있다. 실제 공급자는 팩토리 함수에서 반환된 값으로 제공된다.
- 간단한 팩토리는 다른 제공자에 의존하지 않을 수 있지만, 복잡한 팩토리는 다른 제공자를 직접 주입받을 수 있다. 후자의 경우 팩토리 공급자 구문에는 다음과 같은 두 가지 메커니즘이 있다.
    
    ```tsx
    const connectionProvider = {
      provide: 'CONNECTION',
      useFactory: (optionsProvider: MyOptionsProvider, optionalProvider?: string) => {
        const options = optionsProvider.get();
        return new DatabaseConnection(options);
      },
      inject: [MyOptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
      //       \______________/             \__________________/
      //        This provider                The provider with this token
      //        is mandatory.                can resolve to `undefined`.
    };
    
    @Module({
      providers: [
        connectionProvider,
        MyOptionsProvider, // class-based provider
        // { provide: 'SomeOptionalProvider', useValue: 'anything' },
      ],
    })
    export class AppModule {}
    ```
    
    여기서 `inject`는 `useFactory` 함수에 넘겨줄 의존성 리스트임
    

### 별칭 공급자: `useExisting`

- `useExisting` 구문을 사용하면 기존 공급자에 대한 별칭을 생성할 수 있다.
- 이를 통해 동일한 제공자에게 액세스하는 두 가지 방법이 생성된다.
- 예에서 문자열 기반 토큰 `‘AliasedLoggerService’`는 클래스 기반 토큰 `LoggerService`의 별칭이다.

```tsx
@Injectable()
class LoggerService {
  /* implementation details */
}

const loggerAliasProvider = {
  provide: 'AliasedLoggerService',
  useExisting: LoggerService,
};

@Module({
  providers: [LoggerService, loggerAliasProvider],
})
export class AppModule {}
```

### 서비스 기반이 아닌 공급자

- 공급자는 종종 서비스를 제공하지만, 그 용도에만 국한되지는 않는다. 공급자는 어떤 값이든 제공할 수 있다.
- 예를 들어 공급자는 다음과 같이 현재 환경에 따라 구성 객체 배열을 제공할 수 있다.

```tsx
const configFactory = {
  provide: 'CONFIG',
  useFactory: () => {
    return process.env.NODE_ENV === 'development' ? devConfig : prodConfig;
  },
};

@Module({
  providers: [configFactory],
})
export class AppModule {}
```

### 사용자 지정 공급자 내보내기

- 다른 공급자와 마찬가지로 사용자 지정 공급자도 선언된 모듈로 범위가 지정된다. 다른 모듈에서 사용하려면 내보내야 한다.
- 사용자 지정 공급자를 내보내려면 토큰이나 전체 공급자 객체를 사용할 수 있다.

```tsx
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class AppModule {}
```

```tsx
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class AppModule {}
```