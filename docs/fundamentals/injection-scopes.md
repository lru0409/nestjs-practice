# Injection scopes

- Nest에서는 거의 모든 것이 들어오는 요청 간에 공유된다. 데이터베이스 연결 풀, 전역 상태를 가진 싱글턴 서비스 등이 그 예이다.
- Node.js는 Multi-Threaded Stateless 모델을 따르지 않으므로, 싱글턴 인스턴스를 사용하는 것이 완전히 안전하다.
- 하지만 요청 기반의 수명 주기가 바람직한 경우도 있다. 예를 들어 GraphQL 애플리케이션의 요청별 캐싱, 요청 추적, muti-tenancy 등이 있다.
- Injection scopes는 원하는 공급자 수명 수기 동작을 구현할 수 있는 메커니즘을 제공한다.

> **Multi-Threaded Stateless 모델**
> - 요청 하나 = 스레드 하나
> - 각 요청은 자기 전용 스레드에서 처리, 요청이 끝나면 스레드는 반환
> - 상태를 가지면 위험하여 보통 stateless 하게 설계

> **muti-tenancy** : 하나의 애플리케이션이 여러 테넌트(고객, 회사, 조직)를 동시에 서비스하는 구조

### 공급자 범위

공급자는 다음과 같은 범위를 가질 수 있다.

| `DEFAULT` | 공급자의 단일 인스턴스가 애플리케이션 전체에서 공유된다. 인스턴스 수명은 애플리케이션 수명 주기와 직접적으로 연결된다. |
| --- | --- |
| `REQUEST` | 수신되는 각 요청에 대해 공급자의 새 인스턴스가 생성된다. 요청 처리가 완료되면 인스턴스는 가비지 컬렉션된다. |
| `TRANSIENT` | 임시 공급자는 컨슈머 간에 공유되지 않는다. 임시 공급자를 주입하는 각 컨슈머는 새로운 전용 인스턴르를 받게 된다. |

### 사용법

`@Injectable()` 데코레이터 옵션 객체에 `scope` 속성을 전달해 주입 범위를 지정한다.

```tsx
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {}
```

사용자 지정 공급자 등록 시 다음과 같이 범위 속성을 설정한다.

```tsx
{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.TRANSIENT,
}
```

싱글턴 범위는 기본적으로 사용되며 별도로 선언할 필요가 없다. 만약 공급자를 싱글턴 범위로 선언하려면 `scope` 속성에 `Scope.DEFAULT` 값을 사용하자.

> 웹소켓 게이트웨이는 싱글턴으로 동작해야 하므로 요청 범위 공급자를 사용해선 안 된다. 각 게이트웨이는 실제 소켓을 캡슐화하며 여러 번 인스턴스화될 수 없다.
> 
> 이러한 제한 사항은 Passport 전략이나 Cron 컨트롤러와 같은 다른 공급자에도 적용된다.

### 컨트롤러 범위

- 컨트롤러는 범위를 가질 수 있으며, 이 범위는 해당 컨트롤러에 선언된 모든 요청 메서드 핸들러에 적용된다.
- 공급자의 범위와 마찬가지로 컨트롤러의 범위는 해당 컨트롤러의 수명 주기를 정의한다. 요청 범위 컨트롤러의 경우, 각 요청에 대해 새 인스턴스가 생성되고 요청 처리가 완료되면 가비지 컬렉션된다.
- `ControllerOptions` 객체의 `scope` 속성을 사용해 컨트롤러 범위를 선언한다.

```tsx
@Controller({
  path: 'cats',
  scope: Scope.REQUEST,
})
export class CatsController {}
```

### 범위 계층 구조

- `REQUEST` 범위는 주입 체인을 따라 위로 버블링된다. `REQUEST` 범위 공급자에 의존하는 컨트롤러는 자체적으로 `REQUEST` 범위를 갖게 된다.
- `TRANSIENT` 범위는 주입되는 순간 새로 생성된다. 따라서 `REQUEST` 범위와 달리 상위 객체의 수명에 영향을 주지 않는다.

### 요청 공급자

HTTP 서버 기반 애플리케이션에서 요청 범위 공급자를 사용할 때, 원래 요청 객체에 대한 참조에 접근해야 할 수 있다. 이를 위해 `REQUEST` 객체를 주입할 수 있다.

```tsx
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
```

기본 플랫폼/프로토콜 차이로 인해 마이크로서비스 애플리케이션과 GraphQL 애플리케이션에서 들어오는 요청에 접근하는 방식이 약간 다르다. GraphQL 애플리케이션에서는 `REQUEST` 대신 `CONTEXT`를 주입해야 한다.

```tsx
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private context) {}
}
```

그런 다음 `GraphQLModule`에서 `context` 값을 구성하여 `request`를 속성으로 포함시킨다.

### Inquirer 공급자

로깅 또는 메트릭 공급자처럼 공급자가 생성된 클래스를 얻으려면 `INQUIRER` 토큰을 주입할 수 있다.

```tsx
import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class HelloService {
  constructor(@Inject(INQUIRER) private parentClass: object) {}

  sayHello(message: string) {
    console.log(`${this.parentClass?.constructor?.name}: ${message}`);
  }
}
```

그런 다음 다음과 같이 사용한다.

```tsx
import { Injectable } from '@nestjs/common';
import { HelloService } from './hello.service';

@Injectable()
export class AppService {
  constructor(private helloService: HelloService) {}

  getRoot(): string {
    this.helloService.sayHello('My name is getRoot');

    return 'Hello world!';
  }
}
```

`AppService.getRoot()`를 호출하면, `"AppService: My name is getRoot”`가 콘솔에 출력될 것이다.

### 성능

- 요청 범위 공급자를 사용하면, 각 요청마다 클래스의 인스턴스를 생성해야 하므로 성능에 영향을 미칠 수 있다. (평균 응답 시간과 전체 벤치마킹 결과 저하)
- 공급자가 반드시 요청 범위여야 하는 경우가 아니라면 기본 싱글턴 범위를 사용하는 것이 좋다.

> 요청 범위 공급자를 활용하는 제대로 설계된 애플리케이션은 지연 시간 측면에서 최대 5% 정도만 느려질 것이다.

> **벤치마킹**
> - 서버 성능을 수치로 재서 평가하는 테스트
> - 정해진 조건에서 요청을 많이 보내서 응답 속도, 처리량 같은 성능을 숫자로 재는 것

### Durable 공급자

- REQUEST 범위를 하나라도 쓰면, 컨트롤러와 그 아래 서비스들도 REQUEST 범위가 된다.
- 동시에 3만 요청이 들어오면 컨트롤러 + 서비스 + 의존성 전부 3만 세트가 동시에 메모리에 존재하게 된다.
- 만약 모든 서비스가 의존하는 공통 공급자가 있는데, 이 공급자의 범위가 REQUEST라면 전부 REQUEST 범위가 된다.
- 고객으로 총 10개의 회사가 있고, 회사마다 DB가 다를 때, 요청 헤더/토큰으로 “이 요청이 어느 회사인지” 판단하고자 할 때 → ‘요청마다 tenant를 읽어서 그에 맞는 DB를 주는 공급자를 만들자’고 흔히 생각한다. → 이 공급자를 REQUEST 범위로 만들면, 이 공급자를 쓰는 서비스들 전부 REQUEST 범위가 된다.
    
    논리적으로 같은 회사 요청들은 같은 DI 트리를 써도 된다. → Durable 공급자는 요청을 REQUEST 단위 말고 어떤 기준(tenantId, customerId 같은 것들)으로 묶어 DI 트리를 재사용할 수 있는 공급자이다.
    

```tsx
import {
  HostComponentInfo,
  ContextId,
  ContextIdFactory,
  ContextIdStrategy,
} from '@nestjs/core';
import { Request } from 'express';

const tenants = new Map<string, ContextId>();

export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
  attach(contextId: ContextId, request: Request) {
    const tenantId = request.headers['x-tenant-id'] as string;
    let tenantSubTreeId: ContextId;

    if (tenants.has(tenantId)) {
      tenantSubTreeId = tenants.get(tenantId);
    } else {
      tenantSubTreeId = ContextIdFactory.create();
      tenants.set(tenantId, tenantSubTreeId);
    }

    // If tree is not durable, return the original "contextId" object
    return (info: HostComponentInfo) =>
      info.isTreeDurable ? tenantSubTreeId : contextId;
  }
}
```

> 요청 범위와 유사하게, 내구성(durability)은 주입 체인을 따라 위로 전파된다. 즉 A가 내구성 플래그가 지정된 B에 의존하는 경우, A도 암묵적으로 내구성이 부여된다.(A 공급자에 대해 내구성 플래그를 명시적으로 false로 설정하지 않는 함)

> 이 전략은 테넌트 수가 많은 애플리케이션에는 적합하지 않다.

- `attach` 메서드에서 반환되는 값은 특정 호스트에 사용할 컨텍스트 식별자를 지정한다.
- 위 예에서는 호스트 구성 요소(예: 요청 범위 컨트롤러)가 영구적으로 유지되도록 설정된 경우, 원래 자동 생성된 `contextId` 객체 대신 `tenantSubTreeId`를 사용하도록 지정했다.
- 위 예에서는 페이로드(`REQUEST`/`CONTEXT` 제공자를 의미함)가 등록되지 않는다. durable 트리에 페이로드를 등록하려면 다음 구문을 사용하자.

```tsx
// The return of `AggregateByTenantContextIdStrategy#attach` method:
return {
  resolve: (info: HostComponentInfo) =>
    info.isTreeDurable ? tenantSubTreeId : contextId,
  payload: { tenantId },
};
```

- 이제 `@Inject(REQUEST)` 또는 `@Inject(CONTEXT)`를 사용하여 `REQUEST` 프로바이더(GraphQL 애플리케이션의 경우 `CONTEXT`)를 주입하면 페이로드 객체(이 경우 `tenantId`라는 단일 속성으로 구성됨)가 주입된다.
- `main.ts` 파일에 다음과 같이 등록할 수 있다.
    
    ```tsx
    ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());
    ```
    
- 일반 공급자를 durable 공급자로 만드려면 `durable` 플래그를 `true`로 설정하고 범위를 `Scope.REQUEST로` 변경하면 된다. (`REQUEST` 범위가 이미 주입 체인에 있는 경우에는 필요하지 않음)
    
    ```tsx
    import { Injectable, Scope } from '@nestjs/common';
    
    @Injectable({ scope: Scope.REQUEST, durable: true })
    export class CatsService {}
    ```
    
- 사용자 지정 공급자의 경우 다음과 같이 `durable` 속성을 설정할 수 있다.
    
    ```tsx
    {
      provide: 'foobar',
      useFactory: () => { ... },
      scope: Scope.REQUEST,
      durable: true,
    }
    ```