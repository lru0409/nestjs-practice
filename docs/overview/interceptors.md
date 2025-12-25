# Interceptors

- 인터셉터는 `@Injectable()` 데코레이터가 달린 클래스이며, `NestInterceptor` 인터페이스를 구현함
- 인터셉터는 관점 지향 프로그래밍(AOP) 기법에서 영감을 받은 유용한 기능들을 제공함
- 인터셉터를 사용하면 다음과 같은 가업이 가능함
    - 메서드 실행 전/후에 추가 로직 바인딩
    - 함수에서 반환된 결과 변환
    - 함수에서 발생한 예외 변환
    - 기본 함수 동작 확장
    - 특정 조건(예: 캐싱 목적)에 따라 함수 완전히 재정의

### 기본 사항

- 인터셉터는 두 개의 인수를 받는 `intercept()` 메서드를 구현해야 함
- 첫 번째 인수는 `ExecutionContext` 인스턴스임
    - 가드와 정확히 동일한 객체, `ArgumentsHost`를 상속함
        - `ArgumentsHost`는 원래 핸들러에 전달된 인수를 감싸는 래퍼이며, 애플리케이션 유형에 따라 다른 인수 배열을 포함함. [참고](https://docs.nestjs.com/exception-filters#arguments-host)

### 호출 핸들러

- `intercept()` 메서드의 두 번째 인수는 `CallHandler`임
- `CallHandler` 인터페이스는 `handle()` 메서드를 구현하며, 이 메서드를 사용해 인터셉터의 특정 지점에서 경로 핸들러 메서드를 호출할 수 있음
- `intercept()` 메서드에서 `handle()` 메서드를 호출하지 않으면 경로 핸들러 메서드는 실행되지 않음
- 결과적으로 최종 경로 핸들러 실행 전후에 사용자 지정 로직을 구현할 수 있음
- `handle()` 메서드는 `Observable`을 반환하므로 강력한 RxJS 연산자를 사용해 응답을 추가로 조작할 수 있음
    - `handle()`이 호출되고 `Observable`이 반한되면 경로 핸들러가 트리거 됨. `Observable`을 통해 응답 스트림이 수신되면 스트림에 대한 추가 작업이 수행되고 최종 결과가 호출자에게 반환됨
- 관점 지향 프로그래밍 용어를 사용하면, 경로 핸들러 호출을 포인트컷(Pointcut)이라고 함

### **Aspect interception**

- 인터셉터를 사용해 사용자 상호작용을 로깅할 수 있음
    - 예: 사용자 호출 저장, 비동기 이벤트 전달, 타임스탬프 계산
- 간단한 `LoggingInterceptor` 예시
    
    ```tsx
    import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
    import { Observable } from 'rxjs';
    import { tap } from 'rxjs/operators';
    
    @Injectable()
    export class LoggingInterceptor implements NestInterceptor {
      intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        console.log('Before...');
    
        const now = Date.now();
        return next
          .handle()
          .pipe(
            tap(() => console.log(`After... ${Date.now() - now}ms`)),
          );
      }
    }
    ```
    
    > `NestInterceptor<T, R>`에서 `T`는 핸들러가 원래 반환하는 타입, `R`은 인터셉터가 최종적으로 반환하는 타입을 의미한다.
    
- `handle()`은 RxJS Observable을 반환하므로, 스트림을 조작하는 데 사용할 수 있는 연산자가 다양함
- 위 예에서는 `tab()` 연산자를 사용해 스트림이 정상적 또는 예외적으로 종료될 때 익명 로깅 함수를 호출함

### 인터셉터 바인딩

- 파이프 및 가드와 마찬가지로 컨트롤러 범위, 메서드 범위 또는 전역 범위로 설정할 수 있음
- `@UseInterceptors()` 데코레이터를 사용할 수 있음
    
    ```tsx
    @UseInterceptors(LoggingInterceptor) // 클래스 대신 인스턴스 전달 가능
    export class CatsController {}
    ```
    
    위 구성은 이 컨트롤러에 선언된 모든 핸들러에 인터셉터를 연결함
    
- 인터셉터의 범위를 단일 메서드로 제한하려면 메서드 수준에서 데코레이터를 적용하면 됨
- 전역 인터셉터를 설정하려면 Nest 애플리케이션 인스턴스의 `useGlobalInterceptors()` 메서드 사용
    
    ```tsx
    const app = await NestFactory.create(AppModule);
    app.useGlobalInterceptors(new LoggingInterceptor());
    ```
    
    전역 인터셉터는 모든 컨트롤러와 모든 라우트 핸들러에 대해 사용됨. 모듈 외부에서 등록된 전역 인터셉터는 종속성을 주입할 수 없음. 종속성을 주입하기 위해서 다음과 같이 인터셉터를 설정할 수 있음.
    
    ```tsx
    import { Module } from '@nestjs/common';
    import { APP_INTERCEPTOR } from '@nestjs/core';
    
    @Module({
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: LoggingInterceptor,
        },
      ],
    })
    export class AppModule {}
    ```
    
    > 어떤 모듈에 설정하든 인터셉터는 전역으로 등록된다.
    

### 응답 매핑

- 스트림에는 경로 핸들러에서 반환된 값이 포함되어 있으므로 RxJS의 `map()` 연산자를 사용해 변경 가능

> 응답 매핑 기능은 라이브러리 별 응답 객체와 함께 작동하지 않는다. (`@Res()` 객체 직접 사용 X)

- 각 응답을 일정한 형태로 감싸주는 `TransformInterceptor`를 만들어보자.
    
    ```tsx
    import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
    import { Observable } from 'rxjs';
    import { map } from 'rxjs/operators';
    
    export interface Response<T> {
      data: T;
    }
    
    @Injectable()
    export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
      intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        return next.handle().pipe(map(data => ({ data })));
      }
    }
    ```
    
    `map()` 연산자를 사용해 새로 생성된 객체의 `data` 속성에 응답 객체를 할당하고, 새 객체를 클라이언트에게 반환함

> Nest 인터셉터는 동기 및 비동기 `intercept()` 메서드와 함께 작동한다. 필요한 경우 메서드를 `async`로 간단히 전환할 수 있다.

- 인터셉터는 전체 애플리케이션에서 발생하는 요구사항에 대한 재사용 가능한 솔루션을 만드는 데 매우 유용함
    
    예를 들어 `null` 값이 발생할 때마다 빈 문자열로 변환하는 작업을 한 줄의 코드로 수행할 수 있고, 이 인터셉터를 전역으로 바인딩하면 등록된 각 핸들러에서 자동으로 사용됨
    
    ```tsx
    import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
    import { Observable } from 'rxjs';
    import { map } from 'rxjs/operators';
    
    @Injectable()
    export class ExcludeNullInterceptor implements NestInterceptor {
      intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next
          .handle()
          .pipe(map(value => value === null ? '' : value ));
      }
    }
    ```
    

### 예외 매핑

RxJS의 `catchError()` 연산자를 활용해 발생한 예외를 재정의할 수 있음

```tsx
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  BadGatewayException,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(
        catchError(err => throwError(() => new BadGatewayException())),
      );
  }
}
```

### 스트림 오버라이딩

- 때때로 핸들러 호출을 완전히 막고 다른 값을 반환해야 할 때가 있음
    - 예를 들어 응답 시간을 개선하기 위해 캐시를 구현하는 경우가 있음
- 캐시에서 응답을 반환하는 간단한 캐시 인터셉터 예시
    
    ```tsx
    import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
    import { Observable, of } from 'rxjs';
    
    @Injectable()
    export class CacheInterceptor implements NestInterceptor {
      intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const isCached = true;
        if (isCached) {
          return of([]);
        }
        return next.handle();
      }
    }
    ```
    
    `CacheInterceptor`를 사용하는 엔드포인트가 호출되면, 응답(하드코딩된 빈 배열)이 즉시 반환됨. 일반적인 솔루션을 만드려면 `Reflector`를 활용해 사용자 지정 데코레이터를 만들 수 있음.
    

### 더 많은 연산자

경로 요청의 시간 초과를 처리해보자. 엔드포인트에서 일정 시간 후에도 아무것도 반환하지 않으면 오류 응답으로 종료하고자 함.

```tsx
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(5000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  };
};
```

5초 후에 요청 처리가 취소됨. `RequestTimeoutException`을 발생시키기 전에 사용자 지정 로직(예: 리소스 해제)을 추가할 수도 있음.