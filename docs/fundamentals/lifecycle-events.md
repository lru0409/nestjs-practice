# Lifecycle Events

Nest 애플리케이션과 모든 애플리케이션 요소는 Nest에서 관리하는 수명 주기를 갖는다.

Nest는 주요 수명 주기 이벤트 발생 시 동작(모듈, 공급자 또는 컨트롤러에서 등록된 코드 실행)을 수행할 수 있도록 하는 수명 주기 훅을 제공한다.

### 생명주기 순서

애플리케이션이 부트스트랩되는 시점부터 노드 프로세스가 종료될 때까지 주요 애플리케이션 수명 주기 이벤트 순서는 다음과 같다. 이 수명 주기를 활용하면 모듈과 서비스의 적절한 초기화를 게획하고, 활성 연결을 관리하며, 종료 신호 수신 시 애플리케이션을 안전하게 종료할 수 있다.

![image.png](https://docs.nestjs.com/assets/lifecycle-events.png)

### 라이프사이클 이벤트

Nest는 각 라이프사이클 이벤트에서 모듈, 공급자 및 컨트롤러에 등록된 라이프사이클 훅 메서드를 호출한다.

`onModuleInit` 및 `onApplicationBootstrap`은 `app.init()` 또는 `app.listen()`을 명시적으로 호출한 경우에만 발생한다.

`onModuleDestroy`, `beforeApplicationShutdown`은 `app.close()`를 명시적으로 호출하거나 프로세스가 특수 시스템 신호(예: SIGTERM)를 수신하고, 애플리케이션 부트스트랩 시 `enableShutdownHooks`를 올바르게 호출한 경우에만 발생한다.

| 라이프사이클 훅 메서드 | 훅 메서드 호출을 트리거하는 라이프사이클 이벤트 |
| --- | --- |
| `onModuleInit()` | 호스트 모듈의 종속성 해결 완료 시 호출됨 |
| `onApplicationBootstrap()` | 모든 모듈이 초기화된 후, 연결 수신 대기 전에 호출됨 |
| `onModuleDestroy()` | 종료 신호(예: SIGTERM)가 수신된 후 호출됨 |
| `beforeApplicationShutdown()`  | `onModuleDestroy()` 핸들러가 모두 완료된 후 호출됨, 완료 시 기존의 모든 연결이 닫힘 (`app.close()` 호출) |
| `onApplicationShutdown()` | 연결이 종료된 후(`app.close()`가 완료된 후) 호출됨 |

이러한 이벤트의 경우 `app.close()`를 명시적으로 호출하지 않으면 SIGTERM과 같은 시스템 신호와 연동되도록 설정해야 한다. ([참조](https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown))

> 위의 라이프사이클 훅은 요청 범위 클래스에는 적용되지 않는다. 요청 범위 클래스는 각 요청마다 생성되며, 응답이 전송된 후 자동으로 가비지 컬렉션된다.

### 사용법

각 라이프사이클 훅은 인터페이스로 표현된다. 인터페이스는 TypeScript 컴파일 후에는 존재하지 않으므로 기술적으로 선택 사항이지만, 강력한 타입 검사 및 에디터 도구의 이점을 활용하기 위해 인터페이스를 사용하는 것이 좋다.

라이프사이클 훅을 등록하려면 해당 인터페이스를 구현해야 한다. 예를 들어 특정 클래스의 모듈 초기화 중에 호출될 동작을 등록하려면 `onModuleInit` 인터페이스를 구현한다.

```tsx
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit {
  onModuleInit() {
    console.log(`The module has been initialized.`);
  }
}
```

### 비동기 초기화

`OnModuleInit` 및 `OnApplicationBootstrap` 훅을 사용하면 애플리케이션 초기화 프로세스를 지연시킬 수 있다. (메서드 본문에서 비동기 작업을 기다리는 경우)

```tsx
async onModuleInit(): Promise<void> {
  await this.fetch();
}
```

### 애플리케이션 종료

`onModuleDestory()`, `beforeApplicationShutdown()`, `onApplicationShutdown()` 훅은 종료 단계(`app.close()`를 명시적으로 호출하거나 SIGTERM과 같은 시스템 신호를 수신할 때)에서 호출된다. 이 기능은 Kubernetes에서 컨테이너의 수명 주기를 관리하거나 Heroku에서 Dyno 또는 유사한 서비스를 관리하는 데 자주 사용된다.

종료 훅 리스너는 시스템 리소스를 사용하므로 기본적으로 비활성화되어 있다. 종료 훅을 사용하려면 `enableShutdownHooks()`를 호출해 리스너를 활성화해야 한다.

```tsx
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> 플랫폼의 한계로 인해 NestJS는 Windows에서 애플리케이션 종료 후킹에 대한 지원이 제한적이다. `SIGINT`, `SIGBREAK`, 그리고 어느 정도 `SIGHUP` 신호는 작동하지만 `SIGTERM` 신호는 Windows에서 작동하지 않는다.

> `enableShutdownHooks`는 리스너를 시작하며 메모리를 소모한다. 단일 Node 프로세스에서 여러 Nest 앱을 실행하는 경우(예: Jest를 사용한 병렬 테스트 실행 시), Node에서 과로한 리스너 프로세스에 대한 경고가 발생할 수 있다.
> 
> 이러한 이유로 `enableShutdownHooks`는 기본적으로 비활성화되어 있다. 단일 Node 프로세스에서 여러 인스턴스를 실행할 때는 이 점에 유의하자.
> 
> (알아보기로는 시스템 신호 기반 종료인 경우에만 종료 훅 동작을 위해 `enableShutdownHooks`가 필요함)

애플리케이션이 종료 신호를 수신하면 등록된 `onModuleDestroy()`, `beforeApplicationShutdown()`, `onApplicationShutdown()` 메서드가 해당 신호를 첫 번때 매개변수로 받으며 순서대로 호출된다. 등록된 함수가 비동기 호출을 기다리는 경우 promise가 완료될 때까지 다음 순서를 진행하지 않는다.

```tsx
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal: string) {
    console.log(signal); // e.g. "SIGINT"
  }
}
```

> `app.close()` 시 Nest 앱의 내부 자원이 정리되지만 Node 프로세스 자체는 종료되지 않는다. interval, schedule job 등 이벤트 루프에 pending task가 하나라도 있으면 프로세스는 종료되지 않는다.
