# Exception filters

- 애플리케이션 전체에서 처리되지 않은 모든 예외를 처리하는 내장 예외 계층
- 애플리케이션 코드에서 예외를 처리하지 못하면 이 계층에서 해당 예외를 포착하여 사용자에게 친숙한, 적절한 응답을 자동으로 전송
- 기본적으로 `HttpException` 유형(및 그 하위 클래스)의 예외를 처리하며, 예외가 인식되지 않는 경우 다음과 같은 기본 JSON 응답을 생성함
    
    ```json
    {
      "statusCode": 500,
      "message": "Internal server error"
    }
    ```
    

### 표준 예외 던지기

- Nest는 @nestjs/common 패키지의 내장 `HttpException` 클래스를 제공함
- 일반적인 HTTP REST/GraphQL API 기반 애플리케이션의 경우, 특정 오류 상황이 발생하면 표준 HTTP 응답 객체를 전송하는 것이 가장 좋음
- `HttpException` 생성자는 응답을 결정하는 두 개의 필수 인수를 받음
    1. `response` 인수는 JSON 응답 본문을 정의함. `string` 또는 `object` 타입일 수 있음.
    2. `status` 인수는 HTTP 상태 코드를 정의함.
    3. 선택적으로 options 인수를 통해 오류 원인을 제공할 수 있음. (로깅 목적으로 유용할 수 있음)
        - 예시
            
            ```tsx
            @Get()
            async findAll() {
              try {
                await this.service.findAll()
              } catch (error) {
                throw new HttpException({
                  status: HttpStatus.FORBIDDEN,
                  error: 'This is a custom message',
                }, HttpStatus.FORBIDDEN, {
                  cause: error
                });
              }
            }
            ```
            
    
    ```tsx
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    ```
    
- 기본적으로 JSON 응답 본문에는 두 가지 속성이 포함됨
    1. `statusCode` : `status` 인수에 제공된 HTTP 상태 코드를 기본값으로 사용
    2. `message` : `status`를 기반으로 한 HTTP 오류에 대한 간략한 설명
    
    ```json
    {
      "statusCode": 403,
      "message": "Forbidden"
    }
    ```
    
- JSON 응답 본문을 재정의하려면..
    - `message`만 재정의하려면 `response` 인수에 문자열을 전달해야 함
    - 전체를 재정의하려면 `response` 인수에 객체를 전달해야 함 → Nest는 객체를 직렬화하여 JSON 응답 본문으로 반환함

### 예외 로깅

- 기본적으로 예외 필터는 내장 예외를 로깅하지 않음
- 예외를 로깅하려면 사용자 지정 예외 필터를 만들어야 함

### 사용자 지정 예외

- 대부분의 경우 사용자 지정 예외를 직접 작성하는 대신 Nest 기본 HTTP 예외를 사용할 수 있음
- 사용자 지정 예외를 생성해야 하는 경우, 기본 `HttpException` 클래스를 상속하는 사용자 지정 예외 계층 구조를 만드는 것이 좋음
- `ForbiddenException`은 기본 `HttpException`을 확장하므로 내장된 예외 핸들러와 원활하게 작동함
    
    ```tsx
    export class ForbiddenException extends HttpException {
      constructor() {
        super('Forbidden', HttpStatus.FORBIDDEN);
      }
    }
    ```
    

### 내장 HTTP 예외

- Nest는 기본 `HttpException`을 상속하는 표준 예외 집합을 제공함
- 이 예외들은 @nestjs/common 패키지에서 제공되며, 가장 일반적인 HTTP 예외들을 나타냄
  <details>
  <summary><b>제공되는 표준 예외</b></summary>

  - BadRequestException
  - UnauthorizedException
  - NotFoundException
  - ForbiddenException
  - NotAcceptableException
  - RequestTimeoutException
  - ConflictException
  - GoneException
  - HttpVersionNotSupportedException
  - PayloadTooLargeException
  - UnsupportedMediaTypeException
  - UnprocessableEntityException
  - InternalServerErrorException
  - NotImplementedException
  - ImATeapotException
  - MethodNotAllowedException
  - BadGatewayException
  - ServiceUnavailableException
  - GatewayTimeoutException
  - PreconditionFailException
  </details>

- 모든 내장 예외는 옵션 매개변수를 사용해 오류 원인과 오류 설명을 제공할 수 있음
    
    ```tsx
    throw new BadRequestException('Something bad happened', {
      cause: new Error(),
      description: 'Some error description',
    });
    ```
    
    위의 내용을 사용하면 응답은 다음과 같음
    
    ```json
    {
      "message": "Something bad happened",
      "error": "Some error description",
      "statusCode": 400
    }
    ```
    

### 예외 필터

- 예외 계층을 완전히 제어하고 싶을 때 사용
- 예를 들어 로깅을 하고 싶거나, 동적 요소에 따라 다른 JSON 스키마를 사용하고 있은 경우 등
- 예외를 포착하고 해당 예외에 대한 사용자 지정 응답 로직을 구현하는 예시
    
    ```tsx
    import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
    import { Request, Response } from 'express';
    
    @Catch(HttpException)
    export class HttpExceptionFilter implements ExceptionFilter {
      catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
    
        response
          .status(status)
          .json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
          });
      }
    }
    ```
    
    - Request 및 Response 객체에 접근해야 함
    - Request 객체에 접근해 원본 URL을 추출하고 로깅 정보에 포함할 수 있음
    - Response 객체를 사용해(`response.json()`) 전송되는 응답을 직접 제어할 수 있음
- 모든 예외 필터는 제네릭 `ExceptionFilter<T>` 인터페이스를 구현해야 함
    - 이를 위해서는 지정된 시그니처와 함께 `catch(exception: T, host: ArgumentHost)` 메서드를 제공해야 함
- `@Catch()` 데코레이터를 사용해 잡고 싶은 예외 유형을 단일 매개변수 또는 쉼표로 구분된 목록으로 지정할 수 있음
    - `@Catch(HttpException)`는 해당 필터가 HttpException 유형의 예외만 잡음을 알림

> `@nestjs/platform-fastify`를 사용하는 경우 `response.json()` 대신 `reponse.send()`를 사용할 수 있다.

### Arguments host

- `catch()` 메서드의 매개변수
    - `exception` : 현재 처리 중인 예외 객체
    - `host` : `ArgumentsHost` 객체, 예외가 발생한 컨트롤러의 Request 및 Response 객체에 대한 참조를 가져옴
- 이러한 추상화 수준의 이유는 `ArgumentsHost`가 모든 컨텍스트(HTTP 서버 컨텍스트뿐만 아니라 마이크로서비스 및 웹소켓)에서 작동하기 때문임
- 이후에 모든 실행 컨텍스트의 적절한 기본 인수에 접근하는 방법을 살펴보자. 이를 통해 모든 컨텍스트에서 작동하는 일반적인 예외 필터를 작성할 수 있다.

### 바인딩 필터

- `@UseFilters()` 데코레이터를 사용해 필터를 적용할 수 있음
    - 인스턴스 또는 클래스를 단일 매개변수 또는 쉼표로 구분된 목록으로 전달 가능
    
    ```tsx
    @Post()
    @UseFilters(HttpExceptionFilter)
    async create(@Body() createCatDto: CreateCatDto) {
      throw new ForbiddenException();
    }
    ```
    
    > 가능하면 인스턴스 대신 클래스를 사용하여 필터를 적용하는 것이 좋다. Nest가 전체 모듈에서 동일한 클래스의 인스턴스를 재사용하면 메모리 사용량이 줄어들기 때문이다.
    
- 위 예에서 `HttpExceptionFilter`는 단일 `create()` 라우트 핸들러에만 적용되어 메서드 범위가 됨. 예외 필터는 컨트롤러/리졸버/게이트웨이의 메서드 범위, 컨트롤러 범위 또는 전역 범위 등 다양한 수준으로 범위를 지정할 수 있음.
- 필터를 컨트롤러 범위로 설정하려면 다음과 같이 할 수 있음
    
    ```tsx
    @Controller()
    @UseFilters(new HttpExceptionFilter())
    export class CatsController {}
    ```
    
- 전역 범위 필터를 생성하려면 다음과 같이 할 수 있음
    
    ```tsx
    async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      app.useGlobalFilters(new HttpExceptionFilter());
      await app.listen(process.env.PORT ?? 3000);
    }
    bootstrap();
    ```
    
    `useGlobalFilters()`를 사용하면 필터 등록이 모듈 컨텍스트 외부에서 이루어지므로 종속성 주입이 불가능함. 이 문제를 해결하려면 다음과 같이 해야 함. (필요한 만큼 많은 필터 추가 가능)
    
    ```tsx
    import { Module } from '@nestjs/common';
    import { APP_FILTER } from '@nestjs/core';
    
    @Module({
      providers: [
        {
          provide: APP_FILTER,
          useClass: HttpExceptionFilter,
        },
      ],
    })
    export class AppModule {}
    ```
    
    > 이 방법을 사용해 필터에 대한 종속성을 주입할 때, 이 구조가 사용된 모듈과 관계없이 필터는 전역 범위에 적용된다는 점에 유의해라.
    

### 모든 것을 잡기

- 예외 유형에 관계없이 모든 예외를 잡으려면 `@Catch` 데코레이터의 매개변수 목록을 비워두면 됨
- 아래 예시 코드는 플랫폼별 객체를 직접 사용하지 않고, HTTP 어댑터를 사용하여 응답을 전달하므로 플랫폼에 구애받지 않음
    
    ```tsx
    import {
      ExceptionFilter,
      Catch,
      ArgumentsHost,
      HttpException,
      HttpStatus,
    } from '@nestjs/common';
    import { HttpAdapterHost } from '@nestjs/core';
    
    @Catch()
    export class CatchEverythingFilter implements ExceptionFilter {
      constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
    
      catch(exception: unknown, host: ArgumentsHost): void {
        // In certain situations `httpAdapter` might not be available in the
        // constructor method, thus we should resolve it here.
        const { httpAdapter } = this.httpAdapterHost;
    
        const ctx = host.switchToHttp();
    
        const httpStatus =
          exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
    
        const responseBody = {
          statusCode: httpStatus,
          timestamp: new Date().toISOString(),
          path: httpAdapter.getRequestUrl(ctx.getRequest()),
        };
    
        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
      }
    }
    ```
    

### 상속

- 일반적으로 완전히 사용자 정의된 예외 필터를 만들지만, 내장된 기본 전역 필터를 확장하고 특정 요인에 따라 동작을 재정의하고 싶을 수도 있음
- 예외 처리를 기본 필터에 위임하려면 `BaseException`를 확장하고 상속된 `catch()` 메서드를 호출해야 함

```tsx
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
```

> `BaseExceptionFilter`를 확장하는 메서드 범위 및 컨트롤러 범위 필터는 `new`를 사용해 인스턴스화하는 대신 프레임워크에서 자동으로 인스턴스화하도록 해야 한다.

- 글로벌 필터는 기본 필터를 확장할 수 있으며 두 가지 방법이 있음
    1. 사용자 지정 글로벌 필터를 인스턴스화할 때 `HttpAdapter` 참조를 주입하기
    2. 위에서 봤던 것처럼 `APP_FILTER` 토큰 사용하기