# Controllers

- 들어오는 요청을 처리하고 클라이언트에게 응답을 다시 보내는 역할 수행
- 컨트롤러를 만들기 위해 클래스와 데코레이터 사용
    - 데코레이터 : 클래스를 필요한 메타데이터와 연결하여 Nest가 요청을 해당 컨트롤러에 연결하는 라우팅 맵을 생성할 수 있도록 함

### **기본 예제**

- `@Controller()` : 컨트롤러 정의, 선택적으로 경로 접두사 지정
- `@Get()` : GET HTTP 요청에 대한 핸들러를 생성하도록 지시
    - GET 외에도 모든 HTTP 메서드에 대한 데코레이터가 제공됨
- 핸들러의 경로는 컨트롤러에 선언된 접두사와 메서드 데코레이터에 지정된 경로를 결합하여 결정됨

```tsx

import { Controller, Get } from '@nestjs/common';
import type { Request } from 'express'; // @types/express 패키지를 설치해야 함

@Controller('cats')
export class CatsController {
  @Get()
  findAll(): string { // Nest는 GET /cats 요청을 이 핸들러에 매핑함
    return 'This action returns all cats';
  }
}
```

### **요청 객체 접근 방법**

- `@Req()`를 사용해 요청 객체에 접근 가능함
    - 이 요청 객체는 HTTP 헤더, 본문에 대한 속성을 포함
    
    ```tsx
    @Get()
    findAll(@Req() request: Request): string {
    	...
    }
    ```
    
- `@Param()` : URL 경로 파라미터를 가져옴
    
    ```tsx
    @Get('user/:id')
    getUser(@Param('id') id: string) {
      return `User ID: ${id}`;
    }
    ```
    
- `@Body()` : 요청의 본문을 가져옴
    
    ```tsx
    @Post()
    createUser(@Body() body) {
      return body.name;
    }
    ```
    
- `@Query()` : URL의 쿼리스트링 데이터를 가져옴
    
    ```tsx
    @Get()
    async findAll(@Query('age') age: number, @Query('breed') breed: string) {
      return `This action returns all cats filtered by age: ${age} and breed: ${breed}`;
    }
    ```
    
    - 적절한 쿼리 파서를 사용하려면 HTTP 어댑터를 구성해야 함
        
        ```tsx
        // express의 경우
        const app = await NestFactory.create<NestExpressApplication>(AppModule);
        app.set('query parser', 'extended');
        ```
        
        ```tsx
        // fastify의 경우
        const app = await NestFactory.create<NestFastifyApplication>(
          AppModule,
          new FastifyAdapter({
            querystringParser: (str) => qs.parse(str),
          }),
        );
        ```
        
- `@Headers()` : HTTP 헤더를 가져옴
    
    ```tsx
    @Get()
    checkHeader(@Headers('user-agent') ua: string) {
      return ua;
    }
    ```
    

### **응답 객체 조작 방법**

1. **표준(권장)**
    1. JavaScript 객체 또는 배열을 반환하면 JSON으로 자동 직렬화되고, JavaScript 기본 유형(`string`, `number`, `boolean`)을 반환하면 직렬화를 시도하지 않고 값만 전송함. 값만 반환하면 Nest가 나머지를 처리함.
    2. 응답의 상태 코드는 기본적으로 항상 200임. 단 POST 요청은 201을 사용함. `@HttpCode()` 데코레이터를 추가해 이 동작을 쉽게 변경 가능.
        
        ```tsx
        @Post()
        @HttpCode(204)
        create() {
          return 'This action adds a new cat';
        }
        ```
        
2. **플랫폼 별** : 플랫폼 별 응답 객체를 `@Res()`를 통해 사용 가능함.
    1. 응답 객체에 대한 완전한 제어권을 제공하여 더 유연하다는 장점이 있지만, 코드가 플랫폼에 종속되며 테스트가 어려워질 수 있다는 단점이 있음.
- 상태 코드는 다양한 요인에 따라 달라지는 경우가 많음. 이 경우 플랫폼 별 응답 객체를 사용하거나, 오류가 발생한 경우 예외를 던질 수 있음.
- `@Header()` : 사용자 정의 응답 헤더 지정
- `@Redirect()` : 응답을 특정 URL로 리디렉션시킬 수 있음

### 경로 와일드카드

- 별표(*)를 경로 끝에 사용해 뒤에 어떤 문자열이 와도 매칭되도록 할 수 있음

```tsx
@Get('abcd/*')
findAll() {
  return 'This route uses a wildcard';
}
```

- 이 방식은 express와 fastify 모두에서 작동함
- express의 경우 명명된 와일드카드를 사용할 수 있음
    - 명명된 와일드카드 : 와일드카드 *에 이름을 붙여 라우트 파라미터처럼 사용할 수 있게 만든 문법
        - `/abcd/*splat` → 와일드카드를 통해 잡아낸 전체 문자열을 param으로 받을 수 있음
        
        ```tsx
        import { Controller, Get, Param } from '@nestjs/common';
        
        @Controller()
        export class AppController {
          @Get('files/*path') 
          getWildcard(@Param('path') path: string) {
            return `Wildcard matched: ${path}`;
          }
        }
        ```
        

### 하위 도메인 라우팅

`@Controller` 데코레이터는 들어오는 요청의 HTTP 호스트가 특정 값과 일치하도록 요구하는 `host` 옵션 사용 가능

```tsx
@Controller({ host: 'admin.example.com' })
export class AdminController {
  @Get()
  index(): string {
    return 'Admin page';
  }
}
```

> Fastify는 중첩 라우터를 지원하지 않으므로 하위 도메인 라우팅을 사용하는 경우 기본 Express 어댑터를 사용하는 것이 좋음

- 호스트 이름의 특정 위치에 있는 동적 값을 캡쳐하고, 이 호스트 매개변수는 @HostParam() 데코레이터를 사용해 접근할 수 있음
    
    ```tsx
    @Controller({ host: ':account.example.com' })
    export class AccountController {
      @Get()
      getInfo(@HostParam('account') account: string) {
        return account;
      }
    }
    ```
    

### 상태 관리

- 대부분의 Provider(서비스, 레포지토리, 헬퍼 등)는 기본적으로 싱글톤으로 동작함
- 서버가 시작될 때 인스턴스가 1개 생성되고, 모든 요청에서 같은 인스턴스를 재사용함
- Node.js가 멀티스레드 요청/응답 모델이 아니라 싱글스레드 이벤트 루프 모델이기 때문 → 그래서 싱글톤 패턴은 안전함
- 컨트롤러에 대해 요청 기반 수명을 적용해야 하는 특정 예외 상황도 있음
    - GraphQL에서 요청별 캐싱, Multi-tenancy(각 요청마다 다른 DB 연결을 써야 하는 경우) 등

### 비동기성

- NestJS는 Controller 메서드가 반환하는 값을 보고 그 타입에 맞는 비동기 처리 로직을 자동으로 수행함
- Promise 객체, Observable(RxJS), 동기 값 → 모두 동일하게 결국 응답으로 변환됨

```tsx
@Get()
async findAll(): Promise<any[]> {
  return [];
}
```

- Promise가 resolve될 때까지 기다렸다가 응답을 보냄

```tsx

@Get()
findAll(): Observable<any[]> {
  return of([]);
}
```

- Observable에 자동으로 subscribe()해 스트림이 complete 될 때까지 기다림 → 마지막으로 emit된 값을 응답으로 반환

### **요청 페이로드**

- TypeScript를 사용하는 경우 요청 페이로드를 받기 위해 DTO(데이터 전송 객체) 스키마를 먼저 정의해야 함

```tsx
// create-cat.dto.ts
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

```tsx
// cat.controller.ts
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  return 'This action adds a new cat';
}
```

> `ValidationPipe`는 메서드 핸들러에서 수신하면 안 되는 속성을 필터링할 수 있음. 즉 dto 객체에 포함되지 않는 속성은 자동으로 제거됨.

### 시작 및 실행

Nest가 Controller를 알고 인스턴스를 생성하도록 하려면, AppModule(루트 모듈)에서 직간접적으로 imports 체인에 포함된 특정 모듈의 controllers 배열에 등록되어야 함

```tsx
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';

@Module({
  controllers: [CatsController],
})
export class AppModule {}
```

### 라이브러리 별 접근 방식

- 라이브러리 별 응답 객체를 주입하려면 `@Res` 데코레이터를 사용할 수 있음

```tsx
import { Controller, Get, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Res() res: Response) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  findAll(@Res() res: Response) {
     res.status(HttpStatus.OK).json([]);
  }
}
```

- 이 방법은 응답 객체에 대한 완전한 제어권을 통해 더 큰 유연성을 제공하지만, 신중하게 사용해야 함
- 단점은 다음과 같음
    1. 응답 객채에 대한 API가 다를 수 있기 때문에 코드가 플랫폼에 종속됨
    2. 응답 객체를 모의하는 등의 작업이 필요하기 때문에 테스트가 더 어려워질 수 있음
    3. 인터셉터 및 `@HttpCode`, `@Header`와 같이 표준 응답 처리에 의존하는 Nest 기능과의 호환성 손실
    
    → 원본 응답 객체를 사용하면서 Nest의 표준 응답 흐름을 유지하고 싶다면 `passthrough` 옵션 활성화하기
    
    ```tsx
    @Get()
    findAll(@Res({ passthrough: true }) res: Response) {
      res.status(HttpStatus.OK);
      return [];
    }
    ```