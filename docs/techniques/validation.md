# Validation

Nest는 수신 요청을 자동으로 검증하기 위해 여러 파이프를 기본적으로 제공한다.

- `ValidationPipe`
- `ParseIntPipe`
- `ParseBoolPipe`
- `ParseArrayPipe`
- `ParseUUIDPipe`

`ValidationPipe`는 `class-validator` 패키지와 선언적 유효성 데코레이터를 활용한다. `ValidationPipe`는 수신 페이로드에 유효성 검사 규칙을 적용하는 편리한 방법을 제공하며, 각 모듈의 클래스/DTO 선언에 간단한 어노테이션을 사용해 특정 규칙을 선언할 수 있다.

### 내장 ValidationPipe 사용

```bash
yarn add class-validator class-transformer
```

`ValidationPipe`는 `class-validator` 및 `class-transformer` 패키지를 사용하므로 다양한 옵션을 사용할 수 있다. 파이프에 전달되는 객체를 통해 옵션을 구성할 수 있다.

```tsx
export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
}
```

| 옵션 | 타입 | 설명 |
| --- | --- | --- |
| `enableDebugMessages` | `boolean` | true로 설정하면 유효성 검사기가 오류가 있을 때 콘솔에 추가 경고 메시지를 출력한다. |
| `skipUndefinedProperties` | `boolean` | true로 설정하면 undefined인 속성에 대한 유효성 검사를 건너뛴다. |
| `skipNullProperties` | `boolean` | true로 설정하면 null인 속성에 대한 유효성 검사를 건너뛴다. |
| `skipMissingProperties` | `boolean` | true로 설정하면 null 또는 undefined인 속성에 대한 유효성 검사를 건너뛴다. |
| `whitelist` | `boolean` | true로 설정하면 유효성 검사 데코레이터를 사용하지 않는 모든 속성을 제거해 유효성 검사를 완료한 객체를 반환한다. |
| `forbidNonWhitelisted` | `boolean` | true로 설정하면 화이트리스트에 없는 속서을 제거하는 대신 예외를 발생시킨다. |
| `forbidUnknownValues` | `boolean` | true로 설정하면 unknown 객체에 대한 유효성 검사 시도가 즉시 실패한다. |
| `disableErrorMessages` | `boolean` | true로 설정하면 유효성 검사 오류가 클라이언트로 반환되지 않는다. |
| `errorHttpStatusCode` | `number` | 오류 발생 시 사용할 예외 유형을 지정할 수 있다. 기본값은 `BadRequestException`이다. |
| `exceptionFactory` | `Function` | 유효성 검사 오류 배열을 입력받아 예외 객체를 반환한다. |
| `groups` | `string[]` | 객체 유효성 검사에 사용할 그룹이다. |
| `always` | `boolean` | 데코레이터의 `always` 옵션에 대한 기본값을 설정한다. 기본값은 데코레이터 옵션에서 재정의할 수 있다. |
| `strictGroups` | `boolean` | `groups`가 지정되지 않았거나 비어있는 경우, 그룹이 하나 이상 있는 데코레이터를 무시한다. |
| `dismissDefaultMessages` | `boolean` | true로 설정하면 유효성 검사에서 기본 메시지를 사용하지 않는다. 오류 메시지가 명시적으로 설정되지 않으면 항상 undefined가 된다. |
| `validationError.target` | `boolean` | `ValidationError`에 `target`을 노출할지 여부를 나타낸다. |
| `validationError.value` | `boolean` | `ValidationError`에 유효성 검사 값을 노출할지 여부를 나타낸다. |
| `stopAtFirstError` | `boolean` | true로 설정하면 지정된 속성에 대해 첫 번째 오류를 발견한 후 중지된다. 기본값은 false이다. |

### 자동 유효성 검사

애플리케이션 수준에서 `ValidationPipe`를 바인딩하여 모든 엔드포인트가 잘못된 데이터를 수신하지 않도록 보호할 수 있다.

```tsx
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> TypeScript는 제네릭이나 인터페이스에 대한 메타데이터를 저장하지 않으므로, DTO에 이를 사용할 경우 `ValidationPipe`가 들어오는 데이터를 제대로 검증하지 못할 수 있다. DTO에서는 구체적인 클래스를 사용하는 것을 고려하자.

> DTO를 임포트할 때는 (런타임에 타입이 지워지므로) 타입만 임포트하는 방식을 사용할 수 없다. 즉 `import type { CreateUserDto }` 대신 `import { CreateUserDto }` 와 같이 임포트해야 한다.

다음과 같이 `CreateUserDto`에 유효성 검사 규칙을 추가할 수 있으며, 이 DTO를 사용하는 모든 경로에서 이러한 유효성 검사 규칙이 자동으로 적용된다.

```tsx
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
```

그러면 유효성 검증이 실패할 때, 애플리케이션은 자동으로 다음과 같은 응답 본문을 반환한다.

```
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["email must be an email"]
}
```

`ValidationPipe`는 요청 본문 외의 다른 요청 객체 속성의 유효성 검사에도 사용할 수 있다. 예를 들어 엔드포인트 경로 `:id`에 숫자만 허용되도록 하려면 다음과 같이 할 수 있다.

```tsx
@Get(':id')
findOne(@Param() params: FindOneParams) {
  return 'This action returns a user';
}
```

```tsx
import { IsNumberString } from 'class-validator';

export class FindOneParams {
  @IsNumberString()
  id: string;
}
```

### 페이로드 객체 변환

`ValidationPipe`는 페이로드를 DTO 클래스에 따라 유형이 지정된 객체로 자동 변환할 수 있다. 자동 변환을 활성화하려면 `transform`을 `true`로 설정하자.

자동 변환 옵션을 활성화하면 `ValidationPipe`는 기본 데이터 유형도 변환한다. 다음 예에서 `findOne()` 메서드는 추출된 `id` 경로 매개변수를 인수로 받는데, 메서드 시그니처에 `id` 유형을 숫자로 지정했으므로 `ValidationPipe`는 문자열 식별자를 자동으로 숫자로 변환하려고 시도한다.

```tsx
@Get(':id')
findOne(@Param('id') id: number) {
  console.log(typeof id === 'number'); // true
  return 'This action returns a user';
}
```

### 명시적 변환

자동 변환이 비활성화된 경우 `ParseIntPipe`, `ParseBoolPipe`를 사용해 값을 명시적으로 형변환할 수 있다.

```tsx
@Get(':id')
findOne(
  @Param('id', ParseIntPipe) id: number,
  @Query('sort', ParseBoolPipe) sort: boolean,
) {
  console.log(typeof id === 'number'); // true
  console.log(typeof sort === 'boolean'); // true
  return 'This action returns a user';
}
```

### 매핑된 타입

입력 유효성 검사 타입(DTO)을 구축할 때 동일한 타입에 대해 생성 및 업데이트 변형을 만드는 것이 유용한 경우가 많다. 예를 들어 생성 변형은 모든 필드를 필수로 요구할 수 있고, 업데이트 변형은 모든 필드를 선택 사항으로 만들 수 있다.

- `PartialType()` 함수는 입력 타입의 모든 속성이 선택 사항으로 설정된 타입(클래스)을 반환한다.
    
    ```tsx
    export class CreateCatDto {
      name: string;
      age: number;
      breed: string;
    }
    
    export class UpdateCatDto extends PartialType(CreateCatDto) {}
    ```
    
- `PickType()` 함수는 입력된 타입에서 속성 집합을 선택해 새로운 타입(클래스)을 생성한다.
    
    ```tsx
    export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}
    ```
    
- `OmitType()` 함수는 입력 타입에서 모든 속성을 선택한 다음 특정 키 집합을 제거한 타입을 생성한다.
    
    ```tsx
    export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}
    ```
    
- `IntersectionType()` 함수는 두 가지 타입을 하나의 새로운 타입으로 결합한다.
    
    ```tsx
    export class CreateCatDto {
      name: string;
      breed: string;
    }
    
    export class AdditionalCatInfo {
      color: string;
    }
    
    export class UpdateCatDto extends IntersectionType(
      CreateCatDto,
      AdditionalCatInfo,
    ) {}
    ```
    
- 타입 매핑 유틸리티 함수는 조합 가능하다. 예를 들어 다음 코드는 `CreateCatDto` 타입에서 `name`을 제외한 모든 속성을 선택 사항으로 가지는 타입을 생성한다.
    
    ```tsx
    export class UpdateCatDto extends PartialType(
      OmitType(CreateCatDto, ['name'] as const),
    ) {}
    ```

> 위 타입 매핑 유틸리티 함수들은 `@nestjs/mapped-types` 패키지에서 임포트할 수 있다.

### 배열 구문 분석 및 유효성 검사

배열의 유효성을 검사하려면 배열을 래핑하는 속성을 포함하는 전용 클래스를 만들거나 `ParseArrayPipe`를 사용한다.

```tsx
@Post()
createBulk(
  @Body(new ParseArrayPipe({ items: CreateUserDto }))
  createUserDtos: CreateUserDto[],
) {
  return 'This action adds new users';
}
```

`ParseArrayPipe`는 특히 쿼리 매개변수를 파싱할 때 유용하게 사용될 수 있다. 다음 `findByIds()` 메서드는 다음과 같은 요청에서 들어오는 쿼리 매개변수를 검증한다.

```tsx
@Get()
findByIds(
  @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
  ids: number[],
) {
  return 'This action returns users by ids';
}
```

```
GET /?ids=1,2,3
```

### 웹소켓과 마이크로서비스

여기서는 HTTP 스타일 애플리케이션(Express, Fastify)을 사용하는 예제를 보여주지만, `ValidationPipe`는 전송 방식에 관계없이 웹소켓과 마이크로서비스 모두에서 동일하게 작동한다.