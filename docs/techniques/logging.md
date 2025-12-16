# Logging

- Nest에는 애플리케이션 부트스트래핑 및 예외 처리와 같은 여러 상황에서 사용되는 내장 텍스트 기반 로거가 있다.
- 이 기능은 `@nestjs/common` 패키지의 `Logger` 클래스를 통해 제공된다.
- 다음과 같은 작업을 수행할 수 있다.
    - 로깅을 완전히 비활성화
    - 로그 세부 정보 수준 지정(예: 오류, 경고, 디버그 정보 등 표시)
    - 로그 메시지 형식 구성(raw, json, 색상 표시 등)
    - 기본 로거의 타임스탬프 재정의(예: ISO8601 표준 날짜 형식 사용)
    - 기본 로거를 완전히 재정의
    - 기본 로거를 확장하여 사용자 지정
    - 의존성 주입을 사용해 애플리케이션 구성 및 테스트 간소화
- 내장 로거를 사용하거나 사용자 지정 구현을 만들어 애플리케이션 수준의 이벤트 및 메시지를 로깅 가능하다.
- 외부 로깅 시스템과의 통합, 자동 파일 기반 로깅 또는 중앙 집중식 로깅 서비스의 로그 전달이 필요한 경우 Node.js 로깅 라이브러리를 사용하여 완전히 사용자 정의 가능한 로깅 솔루션을 구현할 수 있다.
    
    널리 사용되는 라이브러리 중 하나는 Pino로, 뛰어난 성능과 유연성으로 유명하다.
    

### 기본 사용자 지정

- 로깅을 비활성화하려면 `NestFactory.create()` 메서드의 두 번째 인수로 전달되는 옵션 객체에서 `logger` 속성을 `false`로 설정해야 한다.
    
    ```tsx
    const app = await NestFactory.create(AppModule, {
      logger: false,
    });
    await app.listen(process.env.PORT ?? 3000);
    ```
    
- 특정 로깅 레벨을 활성화하려면 `logger` 속성에, 표시할 로그 레벨을 지정하는 문자열 배열을 전달해야 한다.
    
    ```tsx
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });
    await app.listen(process.env.PORT ?? 3000);
    ```
    
    배열의 값은 `log`, `fatal`, `error`, `warn`, `debug`, `verbose`의 어떤 조합이든 가능하다.
    
- 색상 출력을 비활성화하려면 `logger` 속성 값으로 `colors` 속성을 `false`로 설정한 `ConsoleLogger` 객체를 전달해야 한다.
    
    ```tsx
    const app = await NestFactory.create(AppModule, {
      logger: new ConsoleLogger({
        colors: false,
      }),
    });
    ```
    
- 각 로그 메시지에 대한 접두사를 구성하려면 `prefix` 속성이 설정된 `ConsoleLogger` 객체를 전달해야 한다.
    
    ```tsx
    const app = await NestFactory.create(AppModule, {
      logger: new ConsoleLogger({
        prefix: 'MyApp', // Default is "Nest"
      }),
    });
    ```
<details>
  <summary>사용 가능한 모든 옵션</summary>

| 옵션 | 설명 | 기본값 |
| --- | --- | --- |
| `logLevels` | 활성화된 로그 레벨 | `['log', 'fatal', 'error', 'warn', 'debug', 'verbose']` |
| `timestamp` | 활성화된 경우, 현재 로그 메시지와 이전 로그 메시지 사이 타임스탬프(시간 차이)를 출력함 (참고: `json`이 활성화된 경우 이 옵션은 사용되지 않음) | `false` |
| `prefix` | 각 로그 메시지에 사용할 접두사 (참고: `json`이 활성화된 경우 이 옵션은 사용되지 않음) | `Nest` |
| `json` | 활성화된 경우 로그 메시지를 JSON 형식으로 출력 | `false` |
| `colors` | 활성화된 경우 로그 메시지를 색상으로 출력 (참고: `json`이 비활성화된 경우 기본값은 `true`, 그렇지 않은 경우 `false`임) | `true` |
| `context` | 로거의 컨텍스트 | `undefined` |
| `compact` | 활성화된 경우 여러 속성을 가진 객체라도 로그 메시지를 한 줄로 출력함. 숫자로 설정하면 모든 속성이 `breakLength`에 맞는 한 가장 안쪽 n개의 요소가 한 줄에 결합됨. 짧은 배열 요소도 함께 그룹화됨. | `true` |
| `maxArrayLength` | 서식 지정 시 포함할 Array, TypedArray, Map, Set, WeakMap, WeakSet 요소의 최대 개수를 지정. 모든 요소를 표시하려면 null 또는 무한대, 요소를 표시하지 않으려면 0 또는 음수로 설정. `json`이 활성화되고, `colors`가 비활성화되고, `compact`가 `true`로 설정된 경우, 파싱 가능한 JSON 출력을 생성하므로 무시됨. | `100` |
| `maxStringLength` | 서식 지정 시 포함할 문자의 최대 개수. 모든 요소를 표시하려면 null 또는 무한대, 표시하지 않으려면 0 또는 음수로 설정. `json`이 활성화되고, `colors`가 비활성화되고, `compact`가 `true`로 설정된 경우, 파싱 가능한 JSON 출력을 생성하므로 무시됨. | `10000` |
| `sorted` | 활성화된 경우 객체 서식 지정 시 키를 정렬. 사용자 지정 정렬 함수를 사용할 수 있음. `json`이 활성화되고, `colors`가 비활성화되고, `compact`가 `true`로 설정된 경우, 파싱 가능한 JSON 출력을 생성하므로 무시됨 | `false` |
| `depth` | 객체 서식 지정 시 재귀 호출 횟수 지정. 최대 호출 스택 크기까지 재귀적으로 호출하려면 Infinity 또는 null을 전달함. `json`이 활성화되고, `colors`가 비활성화되고, `compact`가 `true`로 설정된 경우, 파싱 가능한 JSON 출력을 생성하므로 무시됨. | `5` |
| `showHidden` | 활성화된 경우 객체의 열거할 수 없는 기호와 속성이 형식화된 결과에 포함됨. WeakMap, WeakSet 항목과 사용자 정의 프로토타입 속성도 포함됨 | `false` |
| `breakLength` | 입력 값이 여러 줄로 분할되는 길이. 입력을 한 줄로 형식화하려면 Infinity로 설정(`compact`가 `true`로 설정된 경우) `compact`가 `true`면 기본값은 Inifnity, 그렇지 않은 경우 80임. `json`이 활성화되고, `colors`가 비활성화되고, `compact`가 `true`로 설정된 경우, 파싱 가능한 JSON 출력을 생성하므로 무시됨 | `Infinity` |
</details>

### JSON 로깅

- JSON 로깅은 최신 애플리케이션의 관찰 가능성과 로그 관리 시스템과의 통합에 필수적이다.
- `ConsoleLogger` 객체의 json 속성을 true로 설정해 JSON 로깅을 활성화할 수 있다.
    
    ```tsx
    const app = await NestFactory.create(AppModule, {
      logger: new ConsoleLogger({
        json: true,
      }),
    });
    ```
    
- 로그를 구조화된 JSON 형식으로 출력하면 로그 집계 도구 및 클라우드 플랫폼 같은 외부 시스템과의 통합이 용이하다. 예를 들어 AWS ECS(Elastic Container Service) 같은 플랫폼은 JSON 로그를 지원해 다음과 같은 고급 기능을 활용할 수 있다.
    - 로그 필터링 : 로그 레벨, 타임스탬프, 사용자 지정 메타데이터 같은 필드를 기준으로 필터링 가능
    - 검색 및 분석 : 쿼리 도구를 사용해 애플리케이션 동작의 추세를 분석 및 추적 가능
- [NestJS Mau](https://www.mau.nestjs.com/)를 사용하는 경우, JSON 로깅을 통해 잘 정리된 구조화된 형식으로 로그를 쉽게 확인할 수 있으므로 디버깅 및 성능 모니터닝에 특히 유용하다.

> `json` 속성이 `true`로 설정되면 `ConsoleLogger`는 `colors` 속성을 `false`로 설정해 텍스트 색상화를 자동으로 비활성화한다. 하지만 개발 목적으로는 `colors` 속성을 `true`로 명시적으로 설정해 이 동작을 재정의할 수 있다. 이렇게 하면 색상이 적용된 JSON 로그가 추가된다.

- JSON 로깅이 활성화되면 로그 출력은 다음과 같이 표시된다:
    
    ```json
    {
      "level": "log",
      "pid": 19096,
      "timestamp": 1607370779834,
      "message": "Starting Nest application...",
      "context": "NestFactory"
    }
    ```
    

### 애플리케이션 로깅에서 로거 사용하기

- 각 서비스에서 `Logger` 클래스를 인스턴스화하는 게 좋다. `Logger` 생성자의 `context` 인수로 서비스 이름을 다음과 같이 전달할 수 있다.
    
    ```tsx
    import { Logger, Injectable } from '@nestjs/common';
    
    @Injectable()
    class MyService {
      private readonly logger = new Logger(MyService.name);
    
      doSomething() {
        this.logger.log('Doing something...');
      }
    }
    ```
    
    기본 로거 구현에서는 `context`가 아래 예시의 `NestFactory`처럼 대괄호 안에 출력된다.
    
    ```bash
    [Nest] 19096   - 12/08/2019, 7:12:59 AM   [NestFactory] Starting Nest application...
    ```
    
- `app.useLogger()`를 통해 사용자 지정 로거를 제공하면 Nest 내부적으로 해당 로거가 사용된다.

### 타임스탬프가 포함된 로그

모든 로그 메시지에 타임스탬프 로깅을 활성화하려면 `Logger` 인스턴스 생성 시 선택적 `timestamp: true` 설정을 사용할 수 있다.

```tsx
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name, { timestamp: true });

  doSomething() {
    this.logger.log('Doing something with timestamp here ->');
  }
}
```

이렇게 하면 다음과 같은 형식으로 출력될 것이다.

```bash
[Nest] 19096   - 04/19/2024, 7:12:59 AM   [MyService] Doing something with timestamp here +5ms
```

줄 끝에 `+5ms`가 표시되는 것을 확인하자. 각 로그 문에 대해 이전 메시지와의 시간 차이가 계산되어 줄 끝에 표시된다.

### 사용자 지정 구현

사용자 지정 로거 구현을 제공하려면 `logger` 속성 값을 ㄷ 인터페이스를 구현하는 객체로 설정하면 된다. 예를 들어 JavaScript 전역 콘솔 객체(`LoggerService` 인터페이스를 구현함)를 사용하도록 할 수 있다.

```tsx
const app = await NestFactory.create(AppModule, {
  logger: console,
});
```

사용자 지정 로거를 구현하려면 `LoggerService` 인터페이스의 각 메서드를 구현하면 된다.

그런 다음 Nest 애플리케이션 옵션 객체의 `logger` 속성을 통해 `MyLogger` 인스턴스를 제공할 수 있다.

```tsx
const app = await NestFactory.create(AppModule, {
  logger: new MyLogger(),
});
```

```tsx
import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class MyLogger implements LoggerService {
  // Write a 'log' level log.
  log(message: any, ...optionalParams: any[]) {}
  // Write a 'fatal' level log.
  fatal(message: any, ...optionalParams: any[]) {}
  // Write an 'error' level log.
  error(message: any, ...optionalParams: any[]) {}
  // Write a 'warn' level log.
  warn(message: any, ...optionalParams: any[]) {}
  // Write a 'debug' level log.
  debug?(message: any, ...optionalParams: any[]) {}
  // Write a 'verbose' level log.
  verbose?(message: any, ...optionalParams: any[]) {}
}
```

이 기법은 간단하지만 `MyLogger` 클래스에 대한 의존성 주입을 활용하지 않는다. 이로 인해 테스트 시 어려움이 발생할 수 있으며 `MyLogger`의 재사용성이 제한될 수 있다.

더 나은 해결책은 아래의 의존성 주입 섹션을 참고하자.

### 내장 로거 확장

내장 `ConsoleLogger` 클래스를 확장하고 기본 구현의 특정 동작을 재정의할 수도 있다.

다음과 같이 `super`를 호출하여 특정 로그 메서드 호출을 부모(내장) 클래스로 위임해야 Nest가 예상하는 내장 기능을 사용할 수 있다.

```tsx
import { ConsoleLogger } from '@nestjs/common';

export class MyLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    // add your tailored logic here
    super.error(...arguments);
  }
}
```

### 의존성 주입

- 고급 의존성 기능을 구현하려면 의존성 주입을 활용하는 것이 좋다.
- 예를 들어 로거를 사용자 정의하기 위해 `ConfigService`를 주입할 수 있다.
- 사용자 정의 로거에 의존성 주입을 활성화하려면 `LoggerService` 인터페이스를 구현하는 클래스를 만들고 해당 클래스를 모듈의 공급자로 등록한다.
    
    ```tsx
    import { Module } from '@nestjs/common';
    import { MyLogger } from './my-logger.service';
    
    @Module({
      providers: [MyLogger],
      exports: [MyLogger],
    })
    export class LoggerModule {}
    ```
    
    이렇게 하면 `MyLogger` 클래스가 모듈의 일부이므로 의존성 주입(예: `ConfigService` 주입)을 사용할 수 있다.
    
- 시스템 로깅(예: 부트스트래핑 및 오류 처리)에 이 사용자 지정 로거를 사용하려면 한 가지 추가 기술이 필요하다. 애플리케이션 인스턴스 생성은 모듈 컨텍스트 외부에서 발생하므로 의존성 주입 초기화 단계에 참여하지 않는다. 따라서 `MyLogger` 클래스의 싱글턴 인스턴스를 생성하도록 하려면 적어도 하나의 모듈이 `LoggerModule`을 임포트해야 한다. 그리고 다음과 같이 Nest가 동일한 `MyLogger` 싱글턴 인스턴스를 사용하도록 지시할 수 있다.
    
    ```tsx
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });
    app.useLogger(app.get(MyLogger));
    await app.listen(process.env.PORT ?? 3000);
    ```
    
    > 위 예시에서는 `bufferLogs`를 true로 설정해 사용자 지정 로거가 연결되고 애플리케이션 초기화  > 프로세스가 완료되고 실패할 때까지 모든 로그가 버퍼링되도록 했다. 초기화 프로세스가 실패하면 Nest는 > 원래 `ConsoleLogger`를 사용해 보고된 오류 메시지를 출력한다. 
    >
    > 또한 `autoFlushLogs`를 `false`(기본값은 `true`)로 설정해 `Logger.flush(`) 메서드를 사용해 수동으로 로그를 플러시할 수 있다.
    
    여기서 애플리케이션 인스턴스의 `get()` 메서드를 사용해 `MyLogger` 객체의 싱글턴 인스턴스를 가져온다. 
    

### 사용자 지정 로거 주입하기

다음과 같은 코드를 사용해 내장 로거를 확장하자. `ConsoleLogger` 클래스의 구성 메타데이터로 `scope` 옵션을 제공하고 transient scope를 지정하여 각 기능 모듈에서 `MyLogger`의 고유한 인스턴스를 확보한다.

```tsx
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends ConsoleLogger {
  customLog() {
    this.log('Please feed the cat!');
  }
}
```

다음과 같은 구조를 가진 `LoggerModule`을 생성한다.

```tsx
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

`LoggerModule`을 기능 모듈로 가져온다. 기본 `Logger`를 확장했으므로 `setContext` 메서드를 편리하게 사용할 수 있다.

```tsx
import { Injectable } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  constructor(private myLogger: MyLogger) {
    // Due to transient scope, CatsService has its own unique instance of MyLogger,
    // so setting context here will not affect other instances in other services
    this.myLogger.setContext('CatsService');
  }

  findAll(): Cat[] {
    // You can call all the default methods
    this.myLogger.warn('About to return cats!');
    // And your custom methods
    this.myLogger.customLog();
    return this.cats;
  }
}
```

마지막으로 `main.ts` 파일에서 Nest가 사용자 지정 로거 인스턴스를 사용하도록 지시한다.

```tsx
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(new MyLogger());
```

> `bufferLogs`를 `true`로 설정하는 대신 `logger: false`를 통해 `useLogger`가 호출되기 전까지 로거를 일시적으로 비활성화할 수 있다. 이 경우 중요한 초기화 오류를 놓칠 수 있다는 점에 유의하자.
>
> 초기 메시지 중 일부가 기본 로거로 등록되는 것을 신경쓰지 않는다면 옵션을 생략하면 된다.

### 외부 로거 사용

- 프로덕션 애플리케이션은 고급 필터링, 서식 지정 및 중앙 집중식 로깅을 포함해 특정 로깅 요구사항이 있는 경우가 많다.
- Nest 내장 로거는 Nest 시스템 동작을 모니터링하는 데 사용되며 개발 중에 기능 모듈에서 기본 서식 텍스트 로깅에도 유용할 수 있다.
- 프로덕션 애플리케이션에서는 Winston과 같은 전용 로깅 모듈을 활용하는 경우가 많다.