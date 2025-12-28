# Execution context

- Nest는 여러 애플리케이션 컨텍스트(예: Nest HTTP 서버 기반, 마이크로서비스 및 WebSockets 애플리케이션 컨텍스트)에서 작동하는 애플리케이션을 쉽게 작성할 수 있도록 도와주는 다양한 유틸리티 클래스를 제공한다.
- 이러한 유틸리티는 현재 실행 컨텍스트에 대한 정보를 제공하며, 이를 활용해 다양한 컨트롤러, 메서드 및 실행 컨텍스트에서 작동하는 일반적인 가드, 필터 및 인터셉터를 구축할 수 있다.
- 여기서는 `ArgumentsHost`와 `ExecutionContext`라는 두 가지 유틸리티 클래스를 다룬다.

### ArgumentsHost 클래스

- `ArgumentsHost` 클래스는 핸들러에 전달되는 인수를 가져오는 메서드를 제공한다.
- 이 클래스를 사용하면 적절한 컨텍스트(예: HTTP, RPC(마이크로서비스), WebSockets)를 선택하여 인수를 가져올 수 있다.
- 프레임워크는 `ArgumentsHost` 인스턴스를 제공하며, 일반적으로 `host` 매개변수로 참조되어 필요에 따라 사용할 수 있다. 예를 들어 예외 필터의 `catch()` 메서드는 `ArguementsHost` 인스턴스를 인수로 받아 호출된다.
- `ArgumentsHost`는 핸들러 인수에 대한 추상화 역할을 한다.
    
    예를 들어 HTTP 서버 애플리케이션(`@nestjs/platform-express`를 사용하는 경우)에서 `host` 객체는 Express의 `[request, response, next]` 배열을 캡슐화한다.
    
    반면 GraphQL 애플리케이션의 경우 `host` 객체는 `[root, args, context, info]` 배열을 포함한다.
    

### 현재 애플리케이션 컨텍스트

현재 실행 중인 애플리케이션 유형을 확인하기 위해 `ArgumentsHost`의 `getType()` 메서드를 사용할 수 있다.

```tsx
if (host.getType() === 'http') {
  // do something that is only important in the context of regular HTTP requests (REST)
} else if (host.getType() === 'rpc') {
  // do something that is only important in the context of Microservice requests
} else if (host.getType<GqlContextType>() === 'graphql') {
  // do something that is only important in the context of GraphQL requests
}
```

> `GqlContextType`은 `@nestjs/graphql` 패키지에서 임포트한다.

애플리케이션 유형을 활용하면 보다 일반적인 구성 요소를 작성할 수 있다.

### 호스트 핸들러 인수

- 핸들러에 전달되는 인수 배열을 가져오기 위해 `host` 객체의 `getArgs()` 메서드를 사용할 수 있다.
    
    ```tsx
    const [req, res, next] = host.getArgs();
    ```
    
- `getArgByIndex()` 메서드를 사용해 인덱스를 통해 특정 인수를 가져올 수도 있다.
    
    ```tsx
    const request = host.getArgByIndex(0);
    const response = host.getArgByIndex(1);
    ```
    
    이렇게 인덱스를 사용해 요청 및 응답 객체를 가져오는 것은 애플리케이션을 특정 실행 컨텍스트에 종속시키기 때문에 일반적으로 권장되지 않는다.
    
- `host` 객체의 유틸리티 메서드 중 하나를 사용해 애플리케이션에 적합한 컨텍스트로 전환함으로써 코드를 더욱 견고하게 만들 수 있다.
    
    ```tsx
    switchToRpc(): RpcArgumentsHost;
    switchToHttp(): HttpArgumentsHost;
    switchToWs(): WsArgumentsHost;
    ```
    
- `switchToHttp()` 메서드를 사용하는 예제는 다음과 같다.
    
    ```tsx
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    ```
    
- `WsArgumentsHost`의 메서드는 다음과 같다.
    
    ```tsx
    export interface WsArgumentsHost {
      getData<T>(): T; // Returns the data object.
      getClient<T>(): T; // Returns the client object.
    }
    ```
    
- `RpcArgumentsHost`의 메서드는 다음과 같다.
    
    ```tsx
    export interface RpcArgumentsHost {
      getData<T>(): T; // Returns the data object.
      getContext<T>(): T; // Returns the context object.
    }
    ```
    

### ExecutionContext 클래스

- `ExecutionContext` 클래스는 `ArgumentsHosts`를 상속받아 현재 실행 프로세스에 대한 추가 정보를 제공한다.
- 가드의 `canActivate()` 메서드나 인터셉터의 `intercept()` 메서드와 같이 필요한 곳에 `ExecutionContext` 인스턴스가 제공된다.
- `ExecutionContext`는 다음과 같은 메서드를 제공한다.
    
    ```tsx
    export interface ExecutionContext extends ArgumentsHost {
      // Returns the type of the controller class which the current handler belongs to.
      getClass<T>(): Type<T>;
      // Returns a reference to the handler (method) that will be invoked next in the request pipeline.
      getHandler(): Function;
    }
    ```
    
    `getHandler()` 메서드는 호출될 핸들러에 대한 참조, `getClass()` 메서드는 해당 핸들러가 속한 `Controller` 클래스의 타입을 반환한다.
    
    예를 들어 HTTP 컨텍스트에서 현재 처리 중인 요청이 `CatsController`의 `create()` 메서드에 바인딩된 요청이라면, 다음과 같다.
    
    ```tsx
    const methodKey = ctx.getHandler().name; // "create"
    const className = ctx.getClass().name; // "CatsController"
    ```
    

### Reflection과 메타데이터

- Nest는 `Reflector.createDecorator` 메서드를 통해 생성된 데코레이터와 내장된 `@SetMetadata()` 데코레이터를 통해 라우트 핸들러에 사용자 지정 메타데이터를 첨부할 수 있다.
- 강력한 데코레이터를 생성하려면 `type` 인수를 지정해야 한다. 예를 들어 문자열 배열을 인수로 받는 `Roles` 데코레이터는 다음과 같다.
    
    ```tsx
    // roles.decorator.ts
    
    import { Reflector } from '@nestjs/core';
    
    export const Roles = Reflector.createDecorator<string[]>();
    ```
    
- 특정 경로의 `roles`(사용자 지정 메타데이터)에 접근하기 위해 `Reflector` 헬퍼 클래스를 사용한다. 다음과 같이 `Reflector`을 클래스에 주입할 수 있다.
    
    ```tsx
    // roles.guard.ts
    @Injectable()
    export class RolesGuard {
      constructor(private reflector: Reflector) {}
    }
    ```
    
    이제 핸들러 메타데이터를 읽기 위해 `get()` 메서드를 사용할 수 있다. 첫 번째 인수는 데코레이터 참조, 두 번째 인수는 메타데이터를 가져올 컨텍스트(데코레이터 대상)이다.
    
    ```tsx
    const roles = this.reflector.get(Roles, context.getHandler());
    ```
    
    만약 컨트롤러 클래스의 모든 라우트에 메타데이터를 적용하는 방식으로 컨트롤러를 구성했다면, 두 번째 인수로 `context.getClass()`를 전달하면 된다.
    
    ```tsx
    const roles = this.reflector.get(Roles, context.getClass());
    ```
    
- 만약 `roles` 메타데이터를 클래스와 메서드, 두 수준에 모두 제공했다면 `getAllAndOverride()`나 `getAllAndMerge()` 메서드를 사용할 수 있다.
    
    ```tsx
    // 가장 가까운 것 하나만 사용
    const roles = this.reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()]);
    ```
    
    ```tsx
    // 모든 것을 합쳐서 사용
    const roles = this.reflector.getAllAndMerge(Roles, [context.getHandler(), context.getClass()]);
    ```
    

### 저수준 접근 방식

- `Reflector.createDecorator`를 사용하는 대신 내장된 `@SetMetadata()` 데코레이터를 사용해 핸들러에 메타데이터를 첨부할 수도 있다.
    
    ```tsx
    @Post()
    @SetMetadata('roles', ['admin'])
    async create(@Body() createCatDto: CreateCatDto) {
      this.catsService.create(createCatDto);
    }
    ```
    
- 라우트에서 `@SetMetadata()`를 직접 사용하는 것은 좋은 방법이 아니다. 대신 다음과 같이 자체 데코레이터를 만들 수 있다.
    
    ```tsx
    // roles.decorator.ts
    
    import { SetMetadata } from '@nestjs/common';
    
    export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
    ```
    
    이 방식은 `Reflector.createDecorator` 방식과 다소 유사하지만, 메타데이터 키와 값을 더 세밀하게 제어할 수 있고, 여러 개의 인수를 받는 데코레이터를 만들 수 있다는 점이 다르다.
    
- 이 경우 `Reflector.get`에서 첫 번째 인수로 데코레이터 참조를 전달하는 대신 메타데이터 키를 전달해야 한다.
    
    ```tsx
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    ```