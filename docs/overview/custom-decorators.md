# Custom decorators

- Nest는 데코레이터라는 기능을 기반으로 구축됨
- 데코레이터는 여러 프로그래밍 언어에서 널리 알려진 개념이지만, JavaScript 세계에선 아직 비교적 새로운 개념임

> ES2016 데코레이터는 함수를 반환하는 표현식으로, 대상, 이름, 속성 설명자를 인수로 받는다. 데코레이터 앞에 @ 문자를 붙이고 데코레이터를 적용하려는 대상의 맨 위체 배치하면 된다. 데코레이터는 클래스, 메서드 또는 속성에 대해 정의할 수 있다.
> 

### 매개변수 데코레이터

- Nest는 HTTP 경로 핸들러와 함께 사용할 수 있는 유용한 매개변수 데코레이터 세트를 제공함
- 제공된 데코레이터와 데코레이터가 나타내는 일반 Express(또는 Fastify) 객체 목록
    
    
    | @Request(), @Req() | req |
    | --- | --- |
    | @Response(), @Res() | res |
    | @Next() | next |
    | @Session() | req.session |
    | @Param(param?: string) | req.params / req.params[param] |
    | @Body(param?: string) | req.body / req.body[param] |
    | @Query(param?: string) | req.query / req.query[param] |
    | @Headers(param?: string) | req.headers / req.headers[param] |
    | @Ip() | req.ip |
    | @HostParam() | req.hosts |
- 사용자 지정 데코레이터를 직접 만들 수 있음. Node.js 환경에서는 요청 객체에 속성을 첨부하는 것이 일반적이며, 다음과 같이 각 경로 핸들러에서 속성을 수동으로 추출함.
    
    ```tsx
    const user = req.user;
    ```
    
    코드를 더 읽기 쉽고 투명하게 만드려면 `@User()` 데코레이터를 만들어 모든 컨트롤러에서 재사용할 수 있음
    
    ```tsx
    import { createParamDecorator, ExecutionContext } from '@nestjs/common';
    
    export const User = createParamDecorator(
      (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
      },
    );
    ```
    
    ```tsx
    @Get()
    async findOne(@User() user: UserEntity) {
      console.log(user);
    }
    ```
    

### 데이터 전달

- 데코레이터의 동작이 특정 조건에 따라 달라지는 경우, `data` 매개변수를 사용해 데코레이터의 팩토리 함수에 인수를 전달할 수 있음
- 키를 사용해 요청 객체에서 속성을 추출하는 사용자 지정 데코레이터가 있을 수 있음. 예를 들어 인증 계층에서 요청의 유효성을 검사하고 사용자 엔터티를 요청 객체에 연결한다고 가정해보자. 인증된 요청의 사용자 엔터티는 다음과 같음.
    
    ```tsx
    {
      "id": 101,
      "firstName": "Alan",
      "lastName": "Turing",
      "email": "alan@email.com",
      "roles": ["admin"]
    }
    ```
    
    속성 이름을 키로 사용하고, 해당 속성이 있으면 연결된 값을 반환하는 데코레이터를 정의해보자
    
    ```tsx
    import { createParamDecorator, ExecutionContext } from '@nestjs/common';
    
    export const User = createParamDecorator(
      (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
    
        return data ? user?.[data] : user;
      },
    );
    ```
    
    컨트롤러에서 다음과 같이 `@User()` 데코레이터를 통해 특정 속성에 액세스할 수 있음
    
    ```tsx
    @Get()
    async findOne(@User('firstName') firstName: string) {
      console.log(`Hello ${firstName}`);
    }
    ```
    
    이 데코레이터를 여러 키와 함께 사용해 다양한 속성에 접근 가능함. user 객채가 깊거나 복잡한 경우, 이를 통해 요청 핸들러 구현을 더 읽기 쉽게 만들 수 있음.

> `createParamDecorator<string>((data, ctx) ⇒ …)`처럼 명시적으로 타입 안정성을 적용할 수 있다. 또는 `createParamDecorator((data: string, ctx) ⇒ …)`처럼 팩토리 함수에 매개변수 타입을 지정할 수도 있다. 두 가지 모두 생략하면 `data`의 타입은 `any`가 된다.

### 파이프와 함께 사용하기

- Nest는 사용자 지정 매개변수 데코레이터를 기본 제공 데코레이터(`@Body()`, `@Param()`, `@Query()`)와 동일한 방식으로 처리함
- 파이프를 사용자 지정 데코레이터에 직접 적용할 수도 있음
    
    ```tsx
    @Get()
    async findOne(
      @User(new ValidationPipe({ validateCustomDecorators: true }))
      user: UserEntity,
    ) {
      console.log(user);
    }
    ```

> `validateCustomDecorators` 옵션은 반드시 `true`로 설정해야 한다. `ValidationPipe`는 기본적으로 사용자 지정 데코레이터가 사용된 인수의 유효성을 검사하지 않는다.

### 데코레이터 구성

- Nest는 여러 데코레이터를 구성하는 도우미 메서드를 제공함
- 예를 들어 인증과 관련된 모든 데코레이터를 하나의 데코레이터로 결합하려는 경우, 다음과 같은 구성으로 수행할 수 있음:
    
    ```tsx
    import { applyDecorators } from '@nestjs/common';
    
    export function Auth(...roles: Role[]) {
      return applyDecorators(
        SetMetadata('roles', roles),
        UseGuards(AuthGuard, RolesGuard),
        ApiBearerAuth(),
        ApiUnauthorizedResponse({ description: 'Unauthorized' }),
      );
    }
    ```
    
    사용자 정의 `@Auth()` 데코레이터를 다음과 같이 사용할 수 있음
    
    ```tsx
    @Get('users')
    @Auth('admin')
    findAllUsers() {}
    ```
    
    이렇게 하면 네 가지 데코레이터를 모두 하나의 선언으로 적용하는 효과가 있음

> `@nestjs/swagger` 패키지의 `@ApiHideProperty()` 데코레이터는 구성이 불가능하며, `applyDecorators` 함수와 제대로 작동하지 않는다.