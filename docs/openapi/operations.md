# Operations

OpenAPI 용어로, path는 API가 노출하는 `/users`, `/reports/summary`와 같은 엔드포인트이고, operation은 `GET`, `POST`, `DELETE`와 같이 이러한 경로를 조작하는 데 사용되는 HTTP 메서드이다.

### 태그

특정 태그에 컨트롤러를 연결하려면 `@ApiTags(…tags)` 데코레이터를 사용한다.

```tsx
@ApiTags('cats')
@Controller('cats')
export class CatsController {}
```

### 헤더

요청의 일부로 예상되는 사용자 정의 헤더를 정의하려면 `@ApiHeader()`를 사용한다.

```tsx
@ApiHeader({
  name: 'X-MyHeader',
  description: 'Custom header',
})
@Controller('cats')
export class CatsController {}
```

### 응답

사용자 정의 HTTP 응답을 정의하기 위해서 `@ApiResponse()` 데코레이터를 사용한다.

```tsx
@Post()
@ApiResponse({ status: 201, description: 'The record has been successfully created.'})
@ApiResponse({ status: 403, description: 'Forbidden.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

<details>
<summary>Nest는 `@ApiResponse` 데코레이터에서 상속된 일련의 단축 API 응답 데코레이터를 제공한다.</summary>

  - `@ApiOkResponse()`
  - `@ApiCreatedResponse()`
  - `@ApiAcceptedResponse()`
  - `@ApiNoContentResponse()`
  - `@ApiMovedPermanentlyResponse()`
  - `@ApiFoundResponse()`
  - `@ApiBadRequestResponse()`
  - `@ApiUnauthorizedResponse()`
  - `@ApiNotFoundResponse()`
  - `@ApiForbiddenResponse()`
  - `@ApiMethodNotAllowedResponse()`
  - `@ApiNotAcceptableResponse()`
  - `@ApiRequestTimeoutResponse()`
  - `@ApiConflictResponse()`
  - `@ApiPreconditionFailedResponse()`
  - `@ApiTooManyRequestsResponse()`
  - `@ApiGoneResponse()`
  - `@ApiPayloadTooLargeResponse()`
  - `@ApiUnsupportedMediaTypeResponse()`
  - `@ApiUnprocessableEntityResponse()`
  - `@ApiInternalServerErrorResponse()`
  - `@ApiNotImplementedResponse()`
  - `@ApiBadGatewayResponse()`
  - `@ApiServiceUnavailableResponse()`
  - `@ApiGatewayTimeoutResponse()`
  - `@ApiDefaultResponse()`
</details>
</br>

```tsx
@Post()
@ApiCreatedResponse({ description: 'The record has been successfully created.'})
@ApiForbiddenResponse({ description: 'Forbidden.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

요청에 대한 반환 모델을 지정하려면 클래스를 만들고 모든 속성에 `@ApiProperty()` 데코레이터를 추가해야 한다.

```tsx
export class Cat {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

그러면 Cat 모델을 응답 데코레이터의 type 속성과 함께 사용할 수 있다.

```tsx
@ApiTags('cats')
@Controller('cats')
export class CatsController {
  @Post()
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: Cat,
  })
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }
}
```

각 엔드포인트 또는 컨트롤러에 대한 응답을 개별적으로 정의하는 대신, `DocumentBuilder` 클래스를 사용해 모든 엔드포인트에 대한 전역 응답을 정의할 수 있다. 이 방법은 애플리케이션의 모든 엔드포인트에 대한 전역 응답(예: 401 권한 없음 또는 500 내부 서버 오류와 같은 오류)에 유용하다.

```tsx
const config = new DocumentBuilder()
  .addGlobalResponse({
    status: 500,
    description: 'Internal server error',
  })
  // other configurations
  .build();
```

### 파일 업로드

`@ApiBody`, `@ApiConsumes()`를 함께 사용하면 특정 메서드에 파일 업로드 기능을 활성화할 수 있다.

```tsx
@UseInterceptors(FileInterceptor('file'))
@ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'List of cats',
  type: FileUploadDto,
})
uploadFile(@UploadedFile() file: Express.Multer.File) {}
```

`FileUploadDto`는 다음과 같이 정의된다.

```tsx
class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
```

여러 개의 파일 업로드를 처리하려면 다음과 같이 `FileUploadDto`를 정의할 수 있다.

```tsx
class FilesUploadDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files: any[];
}
```

### 확장 프로그램

요청에 확장 프로그램을 추가하려면 `@ApiExtension()` 데코레이터를 사용하자. 확장 프로그램 이름 앞에는 `x-` 접두사가 붙어야 한다.

```tsx
@ApiExtension('x-foo', { hello: 'world' })
```

### 제네릭 `ApiResponse`

다음과 같은 DTO가 있다고 가정해보자. 

```tsx
export class PaginatedDto<TData> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  results: TData[];
}
```

```tsx
export class CatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

이럻게 하면 `PaginatedDto<CatDto>` 응답을 정의할 수 있다.

```tsx
@ApiOkResponse({
  schema: {
    allOf: [
      { $ref: getSchemaPath(PaginatedDto) },
      {
        properties: {
          results: {
            type: 'array',
            items: { $ref: getSchemaPath(CatDto) },
          },
        },
      },
    ],
  },
})
async findAll(): Promise<PaginatedDto<CatDto>> {}
```

- 이 예제에서는 응답에 allOf `PaginatedDto`가 포함되고 `results` 속성이 `Array<CatDto>` 타입이 되도록 지정한다.
- getSchemaPath() 함수는 주어진 모델에 대한 OpenAPI Spec 파일 내의 OpenAPI 스키마 경로를 반환한다.

`PaginatedDto`는 어떤 컨트롤러에서도 직접 참조되지 않으므로 `SwaggerModule`은 아직 해달 모델 정의를 생성할 수 없다. 이 경우 `@ApiExtraModel` 데코레이터를 사용해 Extra Model로 추가해야 한다.

```tsx
@Controller('cats')
@ApiExtraModels(PaginatedDto)
export class CatsController {}
```

재사용 가능하게 하려면 다음과 같이 `PaginatedDto`에 대한 사용자 정의 데코레이터를 만들 수 있다.

```tsx
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedDto) },
          {
            properties: {
              results: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
```

```tsx
@ApiPaginatedResponse(CatDto)
async findAll(): Promise<PaginatedDto<CatDto>> {}
```

반환 유형이 모호한 문제를 해결하려면 `ApiPaginatedResponse` 스키마에 title 속성을 추가하면 된다.

```tsx
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        title: `PaginatedResponseOf${model.name}`,
        allOf: [
          // ...
        ],
      },
    }),
  );
};
```

```tsx
// Angular
findAll(): Observable<PaginatedResponseOfCatDto>
```