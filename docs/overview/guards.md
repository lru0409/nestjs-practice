# Guards

- 가드는 `@Injectable()` 데코레이터가 달린 클래스로, `CanActivate` 인터페이스를 구현함
- 가드는 단일 책임을 가짐
- 런타임에 존재하는 특정 조건(권한, 역할, ACL 등)에 따라 요청을 경로 핸들러가 처리할지 여부를 결정함
- 기존 Express 애플리케이션에서는 이를 미들웨어가 처리했지만, 미들웨어는 본질적으로 단순하고 `next()` 함수를 호출한 후 어떤 핸들러가 실행될지 알 수 없음.
    
    반면 가드는 `ExecutionContext` 인스턴스에 접근해 다음에 무엇이 실행될지 정확히 알고 있음.
    
- 파이프는 예외 필터, 파이프, 인터셉터와 마찬가지로 요청/응답 주기의 정확한 지점에 처리 로직을 삽입하고 이를 선언적으로 수행할 수 있도록 설계되었음 → 코드를 DRY하고 선언적으로 유지하는 데 도움이 됨

> 가드는 모든 미들웨어가 실행된 후, 인터셉터나 파이프가 실행되기 전에 실행된다.

### 권한 부여(Authorization) 가드

- 특정 경로는 호출자가 충분한 권한을 가지고 있을 때만 사용할 수 있어야 함
- `AuthGuard`는 인증된 사용자(헤더에 토큰이 첨부됨)를 가정함. 토큰을 추출 및 검증하고, 추출된 정보를 사용해 요청 진행 여부를 결정함.

```tsx
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}
```

- `validateRequest()` 함수 내부의 로직은 필요에 따라 간단하거나 정교할 수 있음
- 모든 가드는 `canActivate()` 함수를 구현해야 하며, 이 함수는 현재 요청이 허용되는지 여부를 나타내는 bool 값을 반환해야 함
- 응답은 동기식 또는 비동기식(Promise 또는 Observable)으로 반호나할 수 있음
- true가 반환되면 요청이 처리되고, false가 반환되면 요청이 거부됨

### 실행 컨텍스트(Execution Context)

- `canActivate()` 함수는 `ExecutionContext` 인스턴스를 인수로 받음
- `ExecutionContext`는 `ArgumentsHost`를 상속받음 → `Request` 객체에 대한 참조를 가져올 수 있음
- `ExecutionContext`는 ArgumentsHost를 확장함으로써 현재 실행 프로세스에 대한 추가 정보를 제공하는 여러 가지 새로운 도우미 메서드를 추가함. 이는 보다 일반적인 가드를 구축하는 데 도움이 됨.
    
    [참고](https://docs.nestjs.com/fundamentals/execution-context)
    

### 역할 기반 인증

- 특정 역할을 가진 사용자에게만 접근을 허용하는 가드를 구축해보자. 앞으로 더 확장해보자.

```tsx
// roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
```

### 가드 바인딩

- 파이프 및 예외 필터와 마찬가지로 가드를 컨트롤러 범위, 메서드 범위, 또는 전역 범위로 설정할 수 있음
- `@UseGuards()` 데코레이터를 사용해 컨트롤러 범위 가드를 설정할 수 있음
    
    ```tsx
    @Controller('cats')
    @UseGuards(RolesGuard) // 클래스 대신 인스턴스 전달 가능
    export class CatsController {}
    ```
    
    위 예시는 이 컨트롤러에 선언된 모든 핸들러에 가드를 연결함
    
- 단일 메서드에만 가드를 적용하려면 메서드 수준에서 `@UseGuards()` 데코레이터를 사용하면 됨
- 전역 가드를 설정하려면 Nest 애플리케이션 인스턴스의 `useGlobalGuards()` 메서드를 사용
    
    ```tsx
    const app = await NestFactory.create(AppModule);
    app.useGlobalGuards(new RolesGuard());
    ```
    
    모듈 외부에서 등록된 전역 가드는 모듈 컨텍스트 외부에서 이루어지므로 종속성을 주입할 수 없음. 종속성을 주입하고 싶다면 다음과 같이 가드를 설정할 수 있음.
    
    ```tsx
    import { Module } from '@nestjs/common';
    import { APP_GUARD } from '@nestjs/core';
    
    @Module({
      providers: [
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
      ],
    })
    export class AppModule {}
    ```
    
    > 어떤 모듈에 설정하든 가드는 전역으로 등록된다.
    

### 핸들러별 역할 설정

- CatsController는 경로마다 다른 권한 체계를 가질 수 있음. 어떤 경로는 관리자만 사용할 수 있고, 어떤 경로는 모든 사용자에 공개될 수 있음.
    
    → 어떻게 유연하고 재사용 가능한 방식으로 역할과 경로를 일치시킬 수 있을까?
    
- Nest는 `Reflector.createDecorator` 정적 메서드를 통해 생성된 데코레이터 또는 내장 `@SetMetadata()` 데코레이터를 통해 경로 핸들러에 사용자 지정 메타데이터를 첨부할 수 있는 기능을 제공함
- `Reflector.createDecorator`를 사용해 핸들러에 메타데이터를 첨부하는 `@Roles()` 데코레이터를 만들어보자
    
    ```tsx
    import { Reflector } from '@nestjs/core';
    
    export const Roles = Reflector.createDecorator<string[]>();
    ```
    
    여기서 `Roles` 데코레이터는 `string[]` 유형의 단일 인수를 받는 함수임
    핸들러에 다음과 같이 데코레이터를 추가하면 됨:
    
    ```tsx
    @Post()
    @Roles(['admin'])
    async create(@Body() createCatDto: CreateCatDto) {
      this.catsService.create(createCatDto);
    }
    ```
    
    `Roles` 데코레이터 메타데이터를 `create()` 메서드에 연결하여 관리자 역할을 가진 사용자만 이 경로에 접근할 수 있도록 함.
    
- `SetMetadata()` 데코레이터를 사용하는 방법은 [여기](https://docs.nestjs.com/fundamentals/execution-context#low-level-approach)를 참조

### RolesGuard 완성하기

- 현재 사용자에게 할당된 역할과 현재 처리 중인 경로에 필요한 역할을 비교해 반환 값을 조건부로 만들자
- 경로의 역할(사용자 지정 메타데이터)에 액세스하기 위해 `Reflector` 도우미 클래스를 사용함

```tsx
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return matchRoles(roles, user.roles);
  }
}
```

- `request.user`에 사용자 인스턴스와 허용된 역할이 포함되어 있다고 가정하자. 앱에서는 사용자 지정 인증 가드(또는 미들웨어)에서 이러한 연결을 설정할 가능성이 높음. [참조](https://docs.nestjs.com/security/authentication)
- 권한이 부족한 사용자가 엔드포인트를 요청하면 Nest는 자동으로 다음 응답을 반환함
    
    ```tsx
    {
      "statusCode": 403,
      "message": "Forbidden resource",
      "error": "Forbidden"
    }
    ```
    
- 가드가 false를 반환하면 내부적으로 `ForbiddenException`가 throw됨. 다른 오류 응답을 반환하려면 고유한 예외를 throw해야 함.
    
    ```tsx
    throw new UnauthorizedException();
    ```
    
- 가드가 발생시킨 예외는 예외 계층(전역 예외 필터와 현재 컨텍스트에 적용된 모든 예외 필터)에서 처리됨

> 권한 부여를 구현하는 방법에 대한 실제 사례를 찾고 있다면 [이 장](https://docs.nestjs.com/security/authorization)을 확인해라