# Decorators

- 사용 가능한 모든 OpenAPI 데코레이터에는 핵심 데코레이터와 구별하기 위한 `Api` 접두사가 붙는다.
- 다음은 사용 가능한 데코레이터 전체 목록과 데코레이터가 적용될 수 있는 수준을 나타낸다.

| `@ApiBasicAuth()` | Method / Controller |
| --- | --- |
| `@ApiBearerAuth()` | Method / Controller |
| `@ApiBody()` | Method |
| `@ApiConsumes()` | Method / Controller |
| `@ApiCookieAuth()` | Method / Controller |
| `@ApiExcludeController()` | Controller |
| `@ApiExcludeEndpoint()` | Method |
| `@ApiExtension()` | Method |
| `@ApiExtraModels()` | Method / Controller |
| `@ApiHeader()` | Method / Controller |
| `@ApiHideProperty()` | Model |
| `@ApiOAuth2()` | Method / Controller |
| `@ApiOperation()` | Method |
| `@ApiParam()` | Method / Controller |
| `@ApiProduces()` | Method / Controller |
| `@ApiSchema()` | Model |
| `@ApiProperty()` | Model |
| `@ApiPropertyOptional()` | Model |
| `@ApiQuery()` | Method / Controller |
| `@ApiResponse()` | Method / Controller |
| `@ApiSecurity()` | Method / Controller |
| `@ApiTags()` | Method / Controller |
| `@ApiCallbacks()` | Method / Controller |