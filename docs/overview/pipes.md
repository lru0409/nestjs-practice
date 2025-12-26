# Pipes

- 파이프는 `@Injectable()` 데코레이터가 달린 클래스로,  `PipeTransform` 인터페이스를 구현함
- 파이프에는 두 가지 일반적인 사용 사례가 있음
    1. 변환 : 입력 데이터를 원하는 형태로 변환하기 (에: 문자열에서 정수로)
    2. 검증 : 입력 데이터를 평가하고 유효한 경우 변경하지 않고 그대로 전달, 유효하지 않은 경우 예외 발생
- 여기서 입력 데이터란 경로 매개변수, 쿼리 문자열 매개변수, 요청 본문 등이 될 수 있음
- 위 두 경우 모두 파이프는 컨트롤러 라우트 핸들러가 처리하는 인수에 대해 작동함
    - 메서드가 호출되기 직전에 파이프가 삽입되고, 파이프는 해당 메서드로 전달되는 인수를 받아 처리
    - 모든 변환 또는 검증 작업 수행 후 변환된 인수를 사용해 라우트 핸들러가 호출됨

> 파이프는 예외 영역 내에서 실행되므로 파이프에서 예외 발생 시, 예외 계층(전역 예외 필터와 현재 컨텍스트에 적용되는 모든 예외 필터)에서 처리된다. 파이프에서 예외가 발생하면 컨트롤러 메서드가 실행되지 않는 것이 명확하다.

### 내장 파이프

- `@nestjs/common` 패키지에서 내보내지는 내장 파이프들
    - ValidationPipe
    - ParseIntPipe
    - ParseFloatPipe
    - ParseBoolPipe
    - ParseArrayPipe
    - ParseUUIDPipe
    - DefaultValuePipe
    - ParseFilePipe
    - ParseDatePipe
- 예를 들어 `ParseInt`는 메서드 핸들러 매개변수가 JavaScript 정수로 변환되도록 하고, 변환 실패 시 예외를 발생시킴
- 아래 예시 기법은 다른 내장 파이프에도 적용됨

### 파이프 바인딩

- 파이프를 사용하려면 파이프 클래스의 인스턴스를 적절한 컨텍스트에 바인딩해야 함
- `ParseIntPipe` 예제에서는 파이프를 특정 경로 핸들러 메서드와 연결하고 해당 메서드가 호출되기 전에 실행되도록 함. 다음과 같은 구문을 사용하는데 이를 메서드 매개변수 수준에서 파이프 바인딩이라고 함.
    
    ```tsx
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
      return this.catsService.findOne(id);
    }
    ```
    
    이렇게 하면 `findOne()` 메서드에서 받는 매개변수가 숫자이거나, 경로 핸들러가 호출되기 전에 예외가 발생함. 예를 들어서 다음과 같이 호출되었다고 가정하면:
    
    ```tsx
    GET localhost:3000/abc
    ```
    
    Nest는 다음과 같은 예외를 던짐
    
    ```tsx
    {
      "statusCode": 400,
      "message": "Validation failed (numeric string is expected)",
      "error": "Bad Request"
    }
    ```
    
- 클래스 대신 인스턴를 전달하면 옵션 설정을 통해 내장 파이프의 동작을 사용자 지정할 수 있음
    
    ```tsx
    
    @Get(':id')
    async findOne(
      @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
      id: number,
    ) {
      return this.catsService.findOne(id);
    }
    ```
    

### 사용자 지정 파이프

```tsx
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}
```

> 모든 파이프에서는 `PipeTransform<T, R>` 제네릭 인터페이스를 구현해야 한다. `T`는 입력 값의 타입, `R`은 `transform()` 메서드의 반환 타입을 나타낸다.

- 모든 파이프는 `PipeTransform` 인터페이스를 구현하기 위해 `transform()` 메서드를 구현해야 함
- `transform()` 메서드에는 두 개의 매개변수가 있음
    - `value` : 현재 처리 중인 메서드 인수(경로 처리 메서드에서 수신하기 전)
    - `metadata` : 현재 처리 중인 메서드 인수의 메타데이터로, 다음과 같은 속성을 가짐
        
        ```tsx
        export interface ArgumentMetadata {
          type: 'body' | 'query' | 'param' | 'custom';
          metatype?: Type<unknown>;
          data?: string;
        }
        ```
        
        - `type` : 인수가 본문, 쿼리, 매개변수, 또는 사용자 지정 매개변수인지 여부를 나타냄
        - `metatype` : 인수의 메타타입을 제공함
            - 경로 처리기 메서드 시그니처에 유형 선언을 생략하거나 vanilla JavaScript를 사용하는 경우 값은 정의되지 않음
        - `data` : 데코레이터에 전달되는 문자열, 데코레이터 괄호를 비워두면 값은 정의되지 않음

### 스키마 기반 유효성 검사

- `CatsController`의 `create()` 메서드를 살펴보자

```tsx
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

- create 메서드로 들어오는 모든 요청에 유효한 본문이 포함되어 있는지 확인해야 함
- 따라서 `createCatDto` 객체의 멤버를 검증해야 함
    - 이 작업을 경로 메서드 핸들러 내에서 수행할 수도 있지만, 이는 단일 책임 원칙(SRP)를 위반함
    - 검증자 클래스를 생성해 작업을 위임할 수도 있지만, 각 메서드 시작 부분에 이 검증자를 호출해야 한다는 단점이 있음
    - 검증 미들웨어 사용도 가능하지만, 미들웨어는 호출될 핸들러와 매개변수를 포함한 실행 컨텍스트를 인식하지 못하므로 애플리케이션 전체의 모든 컨텍스트에서 사용할 수 있는 일반적인 미들웨어를 만드는 것은 불가능함

### 객체 스키마 검증

- Zod 라이브러리를 사용하면 읽기 쉬운 API를 통해 간단한 방식으로 스키마를 생성할 수 있음
- Zod 기반 스키마를 활용하는 검증 파이프를 만들어보자

```bash
yarn add zod
```

```tsx
import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema  } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      throw new BadRequestException('Validation failed');
    }
  }
}
```

- `schema`를 생성자 인수로 받음
- `schema.parse()` 메서드를 적용해 입력된 인수를 제공된 스키마와 비교해 유효성 검사함

### 유효성 검사 파이프 바인딩

`ZodValidationPipe`를 사용하려면 다음과 같이 해야 함

1. `ZodValidationPipe` 인스턴스 생성
2. 파이프의 클래스 생성자에 컨텍스트별 Zod 스키마 전달
3. 파이프를 메서드에 바인딩

```tsx
import { z } from 'zod';

export const createCatSchema = z
  .object({
    name: z.string(),
    age: z.number(),
    breed: z.string(),
  })
  .required();

export type CreateCatDto = z.infer<typeof createCatSchema>;
```

다음과 같이 `@UsePipes()` 데코레이터를 사용해 이를 수행함

```tsx
@Post()
@UsePipes(new ZodValidationPipe(createCatSchema))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

> `zod` 라이브러리를 사용하려면 `tsconfig.json`에서 `strictNullChecks` 구성을 활성화해야 한다.

### 클래스 검증기

> 이 기술을 사용하려면 TypeScript가 필요하며 앱이 vanilla JavaScript의 경우에는 사용할 수 없다.

- Nest는 `class-validator` 라이브러리와 잘 호환됨
- 이 라이브러리를 사용하면 데코레이터 기반 검증을 사용할 수 있음
- 데코레이터 기반 검증은 Nest의 Pipe 기능과 결합하면 처리된 속성의 메타타입에 접근할 수 있기 때문에 매우 강력함

```bash
yarn add class-validator class-transformer
```

- 이제 `CreateCatDto` 클래스에 다음과 같이 데코레이터를 추가할 수 있음
    
    ```tsx
    import { IsString, IsInt } from 'class-validator';
    
    export class CreateCatDto {
      @IsString()
      name: string;
    
      @IsInt()
      age: number;
    
      @IsString()
      breed: string;
    }
    ```
    
    - 별도의 유효성 검사 클래스를 만들 필요 없음
    - validation을 DTO와 분리해서 만들면 두 군데 모두에서 데이터 구조 정보를 관리해야 하지만, class-validator를 사용하면 한 곳에서 데이터 구조와 validation을 관리할 수 있음
- 이제 다음과 같은 `ValidationPipe` 클래스를 사용할 수 있음 (내장 파이프로, 직접 구현할 필요 X)
    
    ```tsx
    import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
    import { validate } from 'class-validator';
    import { plainToInstance } from 'class-transformer';
    
    @Injectable()
    export class ValidationPipe implements PipeTransform<any> {
      async transform(value: any, { metatype }: ArgumentMetadata) {
        if (!metatype || !this.toValidate(metatype)) {
          return value;
        }
        const object = plainToInstance(metatype, value);
        const errors = await validate(object);
        if (errors.length > 0) {
          throw new BadRequestException('Validation failed');
        }
        return value;
      }
    
      private toValidate(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
      }
    }
    ```
    
    - `transform()` 메서드가 비동기로 표시되어 있는데, Nest가 동기 및 비동기 파이프를 모두 지원하기 때문에 가능함
    - 구조 분해를 사용해 `ArgumentMetadata`에서 `metatype` 필드를 추출함
    - 도우미 함수 `toValidate()`는 현재 처리 중인 인수가 네이티브 JavaScript 유형일 때 유효성 검사 단계를 건너뛰도록 하는 역할을 함. 이 경우 유효성 검사 데코레이터를 추가할 수 없으므로 유효성 검사 단계를 거칠 필요가 없기 때문.
    - 클래스 변환 함수 `plainToInstance()`를 사용해 일반 JavaScript 인수 객체를 형식화된 객체로 변환함. 클래스 변환 함수는 앞서 DTO에 정의한 유효성 검사 데코레이터를 사용해야 하므로, 일반 객체가 아닌 적절하게 데코레이션된 객체로 이 변환을 수행해야 함.
    - 유효성 검사 후 값을 변경하지 않고 반환하거나 예외를 throw해야 함
    
    파이프 인스턴스를 경로 핸들러 `@Body()` 데코레이터에 바인딩:
    
    ```tsx
    @Post()
    async create(
      @Body(new ValidationPipe()) createCatDto: CreateCatDto,
    ) {
      this.catsService.create(createCatDto);
    }
    ```

> DTO 객체 검증 시에만 class-validator를 사용할 수 있다. 기본 타입(String, Number 등)을 검증하고자 한다면 NestJS의 기본 파이프(ParseIntPipe 등)를 사용해야 한다.

### 전역 범위 파이프

`ValidationPipe`는 가능한 한 만들어졌으므로 전체 애플리케이션의 모든 경로 핸들러에 적용되도록 전역 범위 파이프로 설정하면 전체 유틸리티를 실현할 수 있음

```tsx
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

위처럼 모듈 외부에서 등록된 전역 파이프는 바인딩이 모듈 컨텍스트 외부에서 수행되었기 때문에 종속성을 주입할 수 없음. 종속성을 주입하고 싶다면 다음과 같이 전역 파이프를 설정할 수 있음.

```tsx
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
```

> 위 구문이 사용된 모듈과 관계없이 파이프는 전역으로 등록된다.

### 내장 ValidationPipe

- Nest에서 기본으로 제공하는 `ValidationPipe`를 사용하면 일반적인 검증 파이프를 직접 만들 필요 없음

### 변환 사용 사례

- 파이프를 사용해 유효성 검증 뿐 아니라 입력 데이터 변환도 수행할 수 있음
- 클라이언트에서 전달된 데이터에서 문자열을 정수로 변환하는 등 변경 과정을 거쳐야 하거나, 일부 필수 데이터 필드가 누락되었을 때 기본 값을 적용하고 싶은 경우 등에 상황에 유용할 수 있음 → 변환 파이프는 클라이언트 요청과 요청 핸들러 사이에 삽입되어 변환을 수행할 수 있음
- 다음은 문자열을 정수 값으로 파싱하는 간단한 `ParseIntPipe`임 (Nest에는 더욱 정교한 내장 `ParseIntPipe`가 있으며, 아래는 단순히 예시임)
    
    ```tsx
    import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
    
    @Injectable()
    export class ParseIntPipe implements PipeTransform<string, number> {
      transform(value: string, metadata: ArgumentMetadata): number {
        const val = parseInt(value, 10);
        if (isNaN(val)) {
          throw new BadRequestException('Validation failed');
        }
        return val;
      }
    }
    ```
    
    그러면 아래와 같이 이 파이프를 매개변수에 바인딩할 수 있음:
    
    ```tsx
    @Get(':id')
    async findOne(@Param('id', new ParseIntPipe()) id) {
      return this.catsService.findOne(id);
    }
    ```
    
- 요청에 제공된 ID를 사용해 데이터베이스에서 기존 사용자 엔터티를 선택해 변환할 수도 있음
    
    ```tsx
    @Get(':id')
    findOne(@Param('id', UserByIdPipe) userEntity: UserEntity) {
      return userEntity;
    }
    ```
    
    이렇게 하면 보일러플레이트 코드를 추상화하여 공통 파이프로 만들고, 코드를 더욱 선언적이고 DRY하게 만들 수 있음
    

### 기본값 제공

- `Parse*` 파이프는 매개변수 값이 정의되어 있어야 함. `null` 또는 `undefined`를 받으면 예외를 발생시킴.
- 누락된 매개변수 값을 처리할 수 있도록 하려면 `Parse*` 파이프가 해당 값을 처리하기 전에 주입할 기본값을 제공해야 함 → `DefaultValuePipe`를 통해 기본값을 제공할 수 있음

```tsx
@Get()
async findAll(
  @Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe) activeOnly: boolean,
  @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
) {
  return this.catsService.findAll({ activeOnly, page });
}
```