# CLI Plugin

- TypeScript의 메타데이터 리플렉션 시스템에는 몇 가지 한계가 있다.
    
    예를 들어 클래스가 어떤 속성으로 구성되어 있는지 파악하거나, 특정 속성이 선택 사항인지 필수 사항인지 구분할 수 없다.
    
- Nest는 TypeScript 컴파일 프로세스를 개선하여 필요한 상용구 코드의 양을 줄여주는 플러그인을 제공한다.

> 이 플러그인은 선택 사항이다. 원하는 경우 모든 데코레이터를 수동으로 선언하거나, 필요한 특정 데코레이터만 선언할 수 있다.

### 개요

Swagger 플러그인은 자동으로 다음을 수행한다.

- `@ApiHideProperty`를 사용하지 않는 한 모든 DTO 속성에 `@ApiProperty` 주석을 추가한다.
- 물음표에 따라 필수 속성을 설정한다. (예: `name?: string`은 `required: false`를 의미함)
- 유형에 따라 `type` 또는 `enum` 속성을 설정한다. (배열도 지원)
- 할당된 기본값을 기준으로 `default` 속성을 설정한다.
- `class-validator` 데코레이터를 기반으로 여러 유효성 검사 규칙을 설정한다.
    
    (`classValidatorShim`을 `true`로 설정한 경우)
    
- 적절한 상태 및 `type`을 가진 모든 엔드포인트에 응답 데코레이터를 추가한다.
- 주석을 기반으로 속성 및 엔드포인트에 대한 설명을 생성한다.
    
    (`introspectComments`를 `true`로 설정한 경우)
    
- 주석을 기반으로 속성에 대한 예제 값을 생성한다.
    
    (`introspectComments`를 `true`로 설정한 경우)
    

파일 이름에는 `.dto.ts` 또는 `.entity.ts` 접미사가 포함되어야 플러그인에서 분석된다. 다른 접미사를 사용하는 경우, `dtoFileNameSuffix` 옵션을 지정해 플러그인의 동작을 조정할 수 있다. (아래 참조)

Swagger 플러그인을 활성화하면 위의 클래스 정의를 아래와 같이 간단하게 선언할 수 있다.

```tsx
export class CreateUserDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiProperty({ enum: RoleEnum, default: [], isArray: true })
  roles: RoleEnum[] = [];

  @ApiProperty({ required: false, default: true })
  isEnabled?: boolean = true;
}
```

```tsx
export class CreateUserDto {
  email: string;
  password: string;
  roles: RoleEnum[] = [];
  isEnabled?: boolean = true;
}
```

> Swagger 플러그인은 TypeScript 타입과 `class-validator` 데코레이터에서 `@ApiProperty()` 어노테이션을 파생한다. 이를 통해 생성된 Swagger UI 문서에서 API를 명확하게 설명할 수 있다. 하지만 런타임 유효성 검사는 여전히 `class-validator` 데코레이터에서 처리되므로, `IsEmail()`, `IsNumber()` 등의 유효성 검사기를 계속 사용해야 한다.

> DTO에서 [Mapped types](https://www.notion.so/Mapped-types-2c5c5f79848380689e5bcbf46c7da373?pvs=21) 유틸리티(예: PartialType)를 사용할 때는 플러그인이 스키마를 인식하도록 `@nestjs/mapped-types` 대신 `@nestjs/swagger`에서 가져와야 한다.

이 플러그인은 추상 구문 트리(ASP)를 기반으로 적절한 데코레이터를 즉시 추가한다. 따라서 코드 곳곳에 `@ApiProperty` 데코레이터가 흩어져 있는 문제로 고민할 필요가 없다.

> Swagger 속성을 재정의해야 하는 경우 `@ApiProperty()`를 통해 명시적으로 설정하면 된다.

### 주석 내부 검사

주석 내부 검사 기능이 활성화되면 CLI 플러그인은 주석을 기반으로 속성에 대한 설명과 예제 값을 생성한다.

- `introspectComments`를 활성화하면 CLI 플러그인이 이러한 주석을 추출하고 속성에 대한 설명을 자동으로 제공할 수 있다.
    
    ```tsx
    /**
     * A list of user's roles
     * @example ['admin']
     */
    roles: RoleEnum[] = [];
    ```
    
- `dtoKeyOfComment` 및 `controllerKeyOfComment` 플러그인 옵션을 사용하면 플러그인이 `ApiProperty` 및 `ApiOperation` 데코레이터에 값을 할당하는 방식을 각각 사용자 지정할 수 있다.
    
    ```tsx
    export class SomeController {
      /**
       * Create some resource
       */
      @Post()
      create() {}
    }
    ```
    
    이는 다음 지시사항과 동일하다.
    
    ```tsx
    @ApiOperation({ summary: "Create some resource" })
    ```

> 모델에 대해서도 동일한 논리가 적용되지만 대신 `ApiProperty` 데코레이터와 함께 사용된다.

- 요약 뿐 아니라 설명(remarks), 태그(예: @deprecated) 및 응답 예시도 다음과 같이 제공할 수 있다.
    
    ```tsx
    /**
     * Create a new cat
     *
     * @remarks This operation allows you to create a new cat.
     *
     * @deprecated
     * @throws {500} Something went wrong.
     * @throws {400} Bad Request.
     */
    @Post()
    async create(): Promise<Cat> {}
    ```
    

### CLI 플러그인 사용 방법

플러그인을 활성화하려면 `nest-cli.json` 파일에 다음 플러그인 구성을 추가하자.
`options` 속성의 경우 플러그인의 동작을 사용자 지정하기 위해 사용할 수 있다.

```tsx
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": false,
          "introspectComments": true,
          "skipAutoHttpCode": true
        }
      }
    ]
  }
}
```

`options` 속성은 다음 인터페이스를 충족해야 한다.

```tsx
export interface PluginOptions {
  dtoFileNameSuffix?: string[];
  controllerFileNameSuffix?: string[];
  classValidatorShim?: boolean;
  dtoKeyOfComment?: string;
  controllerKeyOfComment?: string;
  introspectComments?: boolean;
  skipAutoHttpCode?: boolean;
  esmCompatible?: boolean;
}
```

| Option | Default | Description |
| --- | --- | --- |
| `dtoFileNameSuffix` | `['.dto.ts', '.entity.ts']` | DTO 파일 접미사 |
| `controllerFileNameSuffix` | `.controller.ts` | Controller 파일 접미사 |
| `classValidatorShim` | `true` | `true`로 설정하면 모듈은 `class-validator` 데코레이터를 재사용
(에: `@Max(10)`은 스키마 정의에 `max: 10`을 추가함) |
| `dtoKeyOfComment` | `'description'` | `ApiProperty`에 주석 텍스트를 설정하는 속성 키 |
| `controllerKeyOfComment` | `'summary'` | `ApiOperation`에 주석 텍스트를 설정하는 속성 키 |
| `introspectComments` | `false` | `true`로 설정하면 플러그인이 주석을 기반으로 속성에 대한 설명과 예시 값을 생성 |
| `skipAutoHttpCode` | `false` | 컨트롤러에서 `@HttpCode()`의 자동 추가를 비활성화함 |
| `esmCompatible` | `false` | `true`로 설정하면 `ESM({ “type”: “module” })`을 사용할 때 발생하는 구문 오류를 해결함 |

플러그인 옵션이 업데이트될 때마다 `/dist` 폴더를 삭제하고 애플리케이션을 다시 빌드해라. CLI를 사용하지 않고 사용자 정의 webpack 구성을 사용하는 경우, 이 플러그인을 `ts-loader`와 함께 사용할 수 있다:

```tsx
getCustomTransformers: (program: any) => ({
  before: [require('@nestjs/swagger/plugin').before({}, program)]
}),
```

### SWC 빌더

표준 설정(모노레포가 아닌 경우)에서 SWC 빌더와 함께 CLI 플러그인을 사용하려면 [여기](https://docs.nestjs.com/recipes/swc#type-checking)에 설명된 대로 유형 검사를 활성화해야 한다.

```bash
nest start -b swc --type-check
```

모노레포 설정을 하려면 [여기](https://docs.nestjs.com/recipes/swc#monorepo-and-cli-plugins)의 지침을 따르자.

```bash
npx ts-node src/generate-metadata.ts
# OR npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
```

다음과 같이 `SwaggerModule.loadPluginMetadata` 메서드를 사용해 직렬화된 메타데이터 파일을 로드해야 한다.

```tsx
import metadata from './metadata'; // <-- file auto-generated by the "PluginMetadataGenerator"

await SwaggerModule.loadPluginMetadata(metadata); // <-- here
const document = SwaggerModule.createDocument(app, config);
```

### `ts-jest`와 통합 (e2e 테스트)

e2e 테스트를 실행하기 위해 `ts-jest`는 소스코드 파일을 메모리에서 즉시 컴파일한다. 즉 Nest CLI 컴파일러를 사용하지 않으며 플러그인을 적용하거나 AST 변환을 수행하지 않는다.

플러그인을 활성화하려면 e2e 테스트 디렉터리에 다음 파일을 생성하자.

```tsx
const transformer = require('@nestjs/swagger/plugin');

module.exports.name = 'nestjs-swagger-transformer';
// you should change the version number anytime you change the configuration below - otherwise, jest will not detect changes
module.exports.version = 1;

module.exports.factory = (cs) => {
  return transformer.before(
    {
      // @nestjs/swagger/plugin options (can be empty)
    },
    cs.program, // "cs.tsCompiler.program" for older versions of Jest (<= v27)
  );
};
```

이 설정이 완료되면 Jest 설정 파일에 AST 트랜스포머를 임포트하자. 기본적으로 e2e 테스트 설정 파일은 test 폴더 아래에 있으며 `jest-e2e.json`이라는 이름이다.

`jest@<29` 버전을 사용하는 경우 아래 코드 조각을 사용할 수 있다.

```tsx
{
  ... // other configuration
  "globals": {
    "ts-jest": {
      "astTransformers": {
        "before": ["<path to the file created above>"]
      }
    }
  }
}
```

`jest@^29` 버전을 사용하는 경우 아래 코드 조각을 사용할 수 있다.

```json
{
  ... // other configuration
  "transform": {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        "astTransformers": {
          "before": ["<path to the file created above>"]
        }
      }
    ]
  }
}
```

### `jest` 문제 해결(E2E 테스트)

jest가 구성 변경 사항을 적용하지 않는 경우, Jest가 이미 빌드 결과를 캐시했을 가능성이 있다. 새로운 구성을 적용하려면 Jest의 캐시 디렉토리를 지워야 한다.

```bash
npx jest --clearCache
```

자동 캐시 삭제가 실패할 경우, 다음 명령을 사용해 캐시 폴더를 수동으로 삭제할 수 있다.

```bash
npx jest --showConfig | grep cache
# ex result:
#   "cache": true,
#   "cacheDirectory": "/tmp/jest_rs"

rm -rf  <cacheDirectory value>
```