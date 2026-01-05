# Types and parameters

- `SwaggerModule`은 경로 핸들러에서 모든 `@Body()`, `@Query()`, `@Param()` 데코레이터를 검색해 API 문서를 생성한다. 또한 리플렉션을 활용해 해당 모델 정의를 생성한다.
    
    ```tsx
    @Post()
    async create(@Body() createCatDto: CreateCatDto) {
      this.catsService.create(createCatDto);
    }
    ```
    
    > 본문 정의를 명시적으로 설정하려면 `@ApiBody()` 데코레이터를 사용해야 한다.
    
- `CreateCatDto`에 몇 가지 속성이 선언되어 있지만 Swagger UI에서는 정의가 비어있다. `SwaggerModule`에서 클래스 속성을 볼 수 있도록 하려면 `@ApiProperty()` 데코레이터를 추가하거나 CLI 플러그인을 사용해야 한다.
    
    ```tsx
    import { ApiProperty } from '@nestjs/swagger';
    
    export class CreateCatDto {
      @ApiProperty()
      name: string;
    
      @ApiProperty()
      age: number;
    
      @ApiProperty()
      breed: string;
    }
    ```
    
    > 각 속성에 수동으로 주석을 달기보단 `Swagger` 플러그인을 사용하는 것을 고려해보자. 이 플러그인은 자동으로 주석을 달아준다. ([참조](https://docs.nestjs.com/openapi/cli-plugin))
    
- `@ApiProperty()` 데코레이터를 사용하면 다양한 스키마 객체 속성을 설정할 수 있다.
    
    ```tsx
    @ApiProperty({
      description: 'The age of a cat',
      minimum: 1,
      default: 1,
    })
    age: number;
    ```

> `@ApiProperty({ required: false })`를 명시적으로 입력하는 대신 `@ApiPropertyOptional()` 단축 데코레이터를 사용할 수 있다.

- 속성의 유형을 명시적으로 설정하려면 `type` 키를 사용하자.
    
    ```tsx
    @ApiProperty({
      type: Number,
    })
    age: number;
    ```
    

### 배열

속성이 배열인 경우 다음과 같이 배열 유형을 직접 지정해야 한다.

```tsx
@ApiProperty({ type: [String] })
names: string[];
```

위처럼 배열의 첫 번째 요소로 유형을 포함하거나 `isArray` 속성을 `true`로 설정한다.

### 순환 종속성

클래스 간에 순환 종속성이 있는 경우, lazy function을 사용해 `SwaggerModule`에 타입 정보를 제공하자.

```tsx
@ApiProperty({ type: () => Node })
node: Node;
```

### 제네릭 및 인터페이스

TypeScript는 제네릭이나 인터페이스에 대한 메타데이터를 저장하지 않으므로, DTO에서 제네릭이나 인터페이스를 사용하면 `SwaggerModule`이 런타임에 모델 정의를 제대로 생성하지 못할 수 있다. 예를 들어 다음 코드는 Swagger 모듈에서 제대로 검사되지 않는다.

```tsx
createBulk(@Body() usersDto: CreateUserDto[])
```

이러한 제한을 극복하기 위해 유형을 명시적으로 설정할 수 있다.

```tsx
@ApiBody({ type: [CreateUserDto] })
createBulk(@Body() usersDto: CreateUserDto[])
```

### 열거형

열거형을 식별하려면 `@ApiProperty`의 열거형 속성을 값 배열로 직접 설정해야 한다.

```tsx
@ApiProperty({ enum: ['Admin', 'Moderator', 'User']})
role: UserRole;
```

또는 실제 TypeScript 열거형을 다음과 같의 정의한다.

```tsx
export enum UserRole {
  Admin = 'Admin',
  Moderator = 'Moderator',
  User = 'User',
}
```

그런 다음 `@Query()` 매개변수 데코레이터와 `@ApiQuery()` 데코레이터를 함께 사용해 열거형을 직접 사용할 수 있다.

```tsx
@ApiQuery({ name: 'role', enum: UserRole })
async filterByRole(@Query('role') role: UserRole = UserRole.User) {}
```

`isArray`를 `true`로 설정하면 열거형을 다중 선택으로 선택할 수도 있다.

### 열거형 스키마

기본적으로 열거형 속성은 매개변수에 열거형의 원시 정의를 추가한다.

```yaml
- breed:
    type: 'string'
    enum:
      - Persian
      - Tabby
      - Siamese
```

위의 사양은 대부분 잘 작동한다. 그러나 사양을 입력으로 받아 클라이언트 측 코드를 생성하는 도구를 사용하는 경우, 생성된 코드에 중복된 열거형이 포함되어 문제가 발생할 수 있다.

```tsx
// generated client-side code
export class CatDetail {
  breed: CatDetailEnum;
}

export class CatInformation {
  breed: CatInformationEnum;
}

export enum CatDetailEnum {
  Persian = 'Persian',
  Tabby = 'Tabby',
  Siamese = 'Siamese',
}

export enum CatInformationEnum {
  Persian = 'Persian',
  Tabby = 'Tabby',
  Siamese = 'Siamese',
}
```

> 위의 스니펫은 [NSwag](https://github.com/RicoSuter/NSwag)라는 도구를 사용해 생성되었다.

정확히 동일한 두 개의 열거형이 있는 것을 볼 수 있다. 이 문제를 해결하려면 데코레이터에서 열거형 속성과 함께 열거형 이름을 전달하면 된다.

```tsx
export class CatDetail {
  @ApiProperty({ enum: CatBreed, enumName: 'CatBreed' })
  breed: CatBreed;
}
```

`enumName` 속성을 사용하면 `@nestjs/swagger`가 `CatBreed`를 자체 스키마로 변환하여 이 열거형을 재사용할 수 있다. 사양은 다음과 같다.

```yaml
CatDetail:
  type: 'object'
  properties:
    ...
    - breed:
        schema:
          $ref: '#/components/schemas/CatBreed'
CatBreed:
  type: string
  enum:
    - Persian
    - Tabby
    - Siamese
```

> 열거형을 속성으로 사용하는 모든 데코레이터는 `enumName`도 사용한다.

### 속성 값 예시

`example` 키를 사용해 속성에 대한 단일 예시를 설정할 수 있다.

```tsx
@ApiProperty({
  example: 'persian',
})
breed: string;
```

여러 개의 예를 제공하려면 다음과 같이 구조화된 객체를 전달해 `examples` 키를 사용할 수 있다.

```tsx
@ApiProperty({
  examples: {
    Persian: { value: 'persian' },
    Tabby: { value: 'tabby' },
    Siamese: { value: 'siamese' },
    'Scottish Fold': { value: 'scottish_fold' },
  },
})
breed: string;
```

### 원시 정의

깊이 중첩된 배열이나 행렬과 같은 특정 경우에는 유형을 수동으로 정의해야 할 수 있다.

```tsx
@ApiProperty({
  type: 'array',
  items: {
    type: 'array',
    items: {
      type: 'number',
    },
  },
})
coords: number[][];
```

다음과 같이 원시 객체 스키마를 지정할 수도 있다.

```tsx
@ApiProperty({
  type: 'object',
  properties: {
    name: {
      type: 'string',
      example: 'Error'
    },
    status: {
      type: 'number',
      example: 400
    }
  },
  required: ['name', 'status']
})
rawDefinition: Record<string, any>;
```

컨트롤러 클래스에서 수동으로 입력/출력 콘텐츠를 정의하려면 `schema` 속성을 사용하자.

```tsx
@ApiBody({
  schema: {
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'number',
      },
    },
  },
})
async create(@Body() coords: number[][]) {}
```

### 추가 모델

컨트롤러에서 직접 참조되지 않지만 Swagger 모듈에서 검사해야 하는 추가 모델을 정의하려면 `@ApiExtraModels()` 데코레이터를 사용하자.

```tsx
@ApiExtraModels(ExtraModel)
export class CreateCatDto {}
```

또는 다음과 같이 `extraModels` 속성이 지정된 옵션 객체를 `SwaggerModule.createDocument()` 메서드에 전달할 수 있다.

```tsx
const documentFactory = () =>
  SwaggerModule.createDocument(app, options, {
    extraModels: [ExtraModel],
  });
```

모델에 대한 참조(`$ref`)를 얻으려면 `getSchemaPath(ExtraModel)`함수를 사용하자.

```tsx
'application/vnd.api+json': {
   schema: { $ref: getSchemaPath(ExtraModel) },
},
```

### **oneOf, anyOf, allOf**

스키마를 결합하려면 `oneOf`, `anyOf`, `allOf` 키워드를 사용할 수 있다. ([참조](https://swagger.io/docs/specification/v3_0/data-models/oneof-anyof-allof-not/))

- 각 키워드 간단히 알아보기
    - `oneOf` : 여러 타입 중 정확히 하나만 만족해야 함
    - `anyOf` : 여러 타입 중 하나 이상 만족하면 됨
    - `allOf` : 모든 스키마를 전부 만족해야 함

```tsx
@ApiProperty({
  oneOf: [
    { $ref: getSchemaPath(Cat) },
    { $ref: getSchemaPath(Dog) },
  ],
})
pet: Cat | Dog;
```

다형성 배열(멤버가 여러 스키마에 걸쳐 있는 배열)을 정의하려면 원시 정의를 사용해 유형을 직접 정의해야 한다.

```tsx
type Pet = Cat | Dog;

@ApiProperty({
  type: 'array',
  items: {
    oneOf: [
      { $ref: getSchemaPath(Cat) },
      { $ref: getSchemaPath(Dog) },
    ],
  },
})
pets: Pet[];
```

> `getSchemaPath()` 함수는 `@nestjs/swagger` 에서 임포트한다.

`Cat`과 `Dog`는 모두 `@ApiExtraModels()` 데코레이터를 사용해 추가 모델로 정의해야 한다.

### 스키마 이름 및 설명

생성된 스키마의 이름은 원래 모델 클래스의 이름을 기반으로 한다. (`CreateCatDto` 모델은 `CreateCatDto` 스키마를 생성한다.) 스키마 이름을 변경하려면 `@ApiSchema()` 데코레이터를 사용할 수 있다.

```tsx
@ApiSchema({ name: 'CreateCatRequest' })
class CreateCatDto {}
```

`description` 속성을 사용해 스키마에 설명을 추가할 수도 있다.

```tsx
@ApiSchema({ description: 'Description of the CreateCatDto schema' })
class CreateCatDto {}
```