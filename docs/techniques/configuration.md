# Configuration

애플리케이션은 종종 여러 환경에서 실행되고, 환경에 따라 다른 구성 설정을 사용해야 한다. 예를 들어 로컬 환경에서는 로컬 DB 인스턴스에서만 유효한 특정 데이터베이스 자격 증명을 사용하고, 프로덕션 환경에서는 별도의 DB 자격 증명 세트를 사용할 수 있다.

Node.js 애플리케이션에서는 각 환경을 나타내는 키-값 쌍을 저장하는 .env 파일을 사용하는 것이 일반적이다. 다른 환경에서 앱을 실행하려면 올바른 .`env` 파일(.env.test, .env.staging 등)로 교체하기만 하면 된다. 환경변수는 Node.js 내부에서 `process.env` 전역 변수를 통해 접근할 수 있다. 

Nest에서 이 기법을 효과적으로 사용하는 방법은 적절한 `.env` 파일을 로드하는 `ConfigService`를 제공하는 `ConfigModule`을 만드는 것이다. Nest는 편의를 위해  이 모듈을 `@nestjs/config` 패키지에서 기본적으로 제공한다.

### 설치

```bash
yarn add @nestjs/config
```

> `@nestjs/config` 패키지는 내부적으로 dotenv를 사용한다.

> `@nestjs/config`는 TypeScript 4.1 이상을 필요로 한다.

### 시작하기

```tsx
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

- 일반적으로 루트 `AppModule`에 `ConfigModule`을 가져오고 `.forRoot()` 정적 메서드를 사용해 동작을 제어한다. 이 단게에서 환경 변수 키/값 쌍이 구문 분석된다.
- 위 코드는 프로젝트 루트 디렉터리에서 `.env` 파일을 로드하고 파싱한다. `.env` 파일의 키/값 쌍을 `process.env`에 할당된 환경 변수와 병합하고, 그 결과를 `ConfigService`를 통해 접근할 수 있는 비공개 구조체에 저장한다.
- `forRoot()` 메서드는 `ConfigService` 공급자를 등록하며, 이 공급자는 파싱/병합된 구성 변수를 읽는 `get()` 메서드를 제공한다.
- 환경 변수 이름 충돌 해결에는 dotenv 패키지의 규칙을 따른다. 동일한 키가 런타임 환경 변수와 `.env` 파일에 모두 존재하는 경우, 런타임 환경 변수가 우선한다.
- Nest CLI의 `—env-file` 옵션을 사용해 애플리케이션 시작 전에 로드해야 하는 `.env` 파일의 경로를 지정할 수 있다.
    
    ```bash
    nest start --env-file .env
    ```
    
    (Nest가 `.env` 파일을 읽어 `process.env`에 넣어주는 건 `ConfigModule`이 로드된 후 일어나므로)
    

### 사용자 지정 환경 변수 파일 경로

.env 파일의 경로를 (루트 디렉터리의 `.env`아 아닌 다른 경로로) 지정하려면 `forRoot()`에 전달하는 (선택적) 옵션 객체의 `envFilePath` 속성을 다음과 같이 설정해야 한다.

```tsx
ConfigModule.forRoot({
  envFilePath: '.development.env',
});
```

다음과 같이 여러 개의 `.env` 파일 경로를 지정할 수도 있다.

```tsx
ConfigModule.forRoot({
  envFilePath: ['.env.development.local', '.env.development'],
});
```

동일한 변수가 여러 파일에서 발견될 경우, 첫 번째 파일에 있는 변수가 우선 적용된다.

### 환경 변수 로딩 비활성화

`.env` 파일을 로드하지 않고 런타임 환경에서 환경 변수에 접근하려면 옵션 객체의 `ignoreEnvFile` 속성을 `true`로 설정해야 한다.

```tsx
ConfigModule.forRoot({
  ignoreEnvFile: true,
});
```

### 모듈을 전역적으로 사용하기

다른 모듈에서 `ConfigModule`을 사용하려면 마찬가지로 해당 모듈을 가져와야 한다. 또는 옵션 객체의 `isGlobal` 속성을 `true`로 설정해 전역 모듈로 선언할 수 있다. (루트 모듈에서 `ConfigModule`이 로드된 후에는 다른 모듈에서 `ConfigModule`을 가져올 필요 없음)

```tsx
ConfigModule.forRoot({
  isGlobal: true,
});
```

### 사용자 정의 구성 파일

복잡한 프로젝트의 경우 중첩된 구성 객체를 반환하는 사용자 정의 구성 파일을 활용할 수 있다. 이를 통해

- 관련 구성 설정을 기능별로 그룹화(예: 데이터베이스 관련 설정)하거나
- 관련 설정을 개별 파일에 저장해 독립적으로 관리하거나
- 값을 적절한 유형으로 캐스팅하거나 기본값을 설정할 수 있다.

사용자 지정 구성 파일은 구성 객체를 반환하는 팩토리 함수를 내보낸다.

```tsx
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432
  }
});
```

옵션 객체의 `load` 속성을 사용해 이 파일을 로드할 수 있다.

```tsx
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration], // 배열이므로 여러 구성 파일 로드 가능
    }),
  ],
})
export class AppModule {}
```

사용자 지정 구성 파일은 YAML 형식도 사용할 수 있다. YAML 파일을 읽고 구문 분석하려면 `js-yaml` 패키지를 사용해야 한다.

```yaml
http:
  host: 'localhost'
  port: 8080

db:
  postgres:
    url: 'localhost'
    port: 5432
    database: 'yaml-db'

  sqlite:
    database: 'sqlite.db'
```

```bash
yarn add js-yarml
yarn add -D @types/js-yaml
```

`yaml.load` 함수를 사용해 YAML 파일을 로드할 수 있다.

```tsx
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as yaml from 'js-yaml';

const YAML_CONFIG_FILENAME = 'config.yaml';

export default () => {
  return yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;
};
```

> Nest CLI는 빌드 과정에서 assets(TS 파일이 아닌 파일)를 자동으로 dist 폴더로 이동시키지 않으므로 YAML 파일이 복사되도록 하려면 `nest-cli.json` 파일의 `compilerOptions.assets` 객체에 이 설정을 추가해야 한다.
> 
> - `"assets": [{"include": "../config/*.yaml", "outDir": "./dist/config"}]`

`ConfigModule`에서 `validationSchema` 옵션을 사용하더라도 구성 파일은 자동으로 유효성 검사를 거치지 않는다. 유효성 검사가 필요하거나 변환을 적용하려면 팩토리 함수 내에서 직접 처리해야 한다. 

```tsx
// config/configuration.ts
export default () => {
  const config = yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;

  if (config.http.port < 1024 || config.http.port > 49151) {
    throw new Error('HTTP port must be between 1024 and 49151');
  }

  return config;
};
```

### ConfigService 사용하기

- `ConfigService`를 사용하려는 모듈에 `ConfigModule`을 임포트해야 한다. (옵션 객체에 `isGlobal` 속성을 `true`로 설정한 경우는 제외)
    
    ```tsx
    @Module({
      imports: [ConfigModule],
      // ...
    })
    ```
    
    그런 다음 표준 생성자 주입을 사용해 주입할 수 있다.
    
    ```tsx
    constructor(private configService: ConfigService) {}
    ```
    
- 클래스 내에서는 이렇게 사용할 수 있다. `configService.get` 메서드를 사용해 변수 이름을 전달함으로써 환경 변수를 가져올 수 있다. 타입을 전달해 타입 힌트를 줄 수도 있다.
    
    ```tsx
    // get an environment variable
    const dbUser = this.configService.get<string>('DATABASE_USER');
    
    // get a custom configuration value
    const dbHost = this.configService.get<string>('database.host');
    ```
    
    또한 인터페이스를 타입 힌트로 사용해 중첩된 사용자 지정 구성 객체 전체를 가져올 수도 있다.
    
    ```tsx
    interface DatabaseConfig {
      host: string;
      port: number;
    }
    
    const dbConfig = this.configService.get<DatabaseConfig>('database');
    const port = dbConfig.port;
    ```
    
- `get()` 메서드는 키가 존재하지 않을 때 반환될 기본 값을 정의하는 선택적 두 번째 인수를 받는다.
    
    ```tsx
    const dbHost = this.configService.get<string>('database.host', 'localhost');
    ```
    
- `ConfigService`에는 두 개의 선택적 제네릭(타입 인수)이 있다.
    1. 첫 번째 제네릭은 존재하지 않는 속성에 접근하는 것을 방지하는 데 사용된다.
        
        ```tsx
        interface EnvironmentVariables {
          PORT: number;
          TIMEOUT: string;
        }
        
        constructor(private configService: ConfigService<EnvironmentVariables>) {
          const port = this.configService.get('PORT', { infer: true });
        
          // TypeScript Error: EnvironmentVariables에 URL 속성이 정의되어 있지 않으므로 유효하지 않음
          const url = this.configService.get('URL', { infer: true });
        }
        ```
        
        `infer` 속성을 `true`로 설정하면 `ConfigService.get` 메서드는 인터페이스를 기반으로 속성 유형을 자동으로 추론한다. 또한 점 표기법을 사용하는 경우에도 중첩된 사용자 지정 구성 객체의 속성 유형을 추론할 수 있다.
        
        ```tsx
        constructor(private configService: ConfigService<{ database: { host: string } }>) {
          const dbHost = this.configService.get('database.host', { infer: true })!;
          // typeof dbHost === "string"                                          |
          //                                                                     +--> non-null assertion operator
        }
        ```
        
    2. 두 번째 제네릭은 첫 번째 제네릭에 의존하며, `strictNullChecks`가 켜져 있을 때 `ConfigService` 메서드가 반환할 수 있는 모든 정의되지 않은 유형(undefined)을 제거하는 역할을 한다.
        
        ```tsx
        constructor(private configService: ConfigService<{ PORT: number }, true>) {                                                            ^^^^
          const port = this.configService.get('PORT', { infer: true });
        }
        ```

> `ConfigService.get` 메서드가 사용자 지정 구성 파일에서만 값을 가져오고 `process.env` 변수를 무시하도록 하려면 옵션 객체에서 `skipProcessEnv` 옵션을 `true`로 설정해야 한다.

### 구성 네임스페이스

`registerAs()` 함수를 사용해 “네임스페이스가 지정된” 구성 객체를 반환할 수 있다.

```tsx
// config/database.config.ts
export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432
}));
```

`database` 네임스페이스에서 `host` 값을 가져오려면 점 표기법을 사용한다. 

```tsx
const dbHost = this.configService.get<string>('database.host');
```

점 표기법보다 합리적인 대안은 `database` 네임스페이스를 직접 주입하는 것이다. 이렇게 하면 강력한 타입 검사의 이점을 누릴 수 있다.

```tsx
constructor(
  @Inject(databaseConfig.KEY)
  private dbConfig: ConfigType<typeof databaseConfig>,
) {}
```

### 모듈의 네임스페이스 구성

애플리케이션의 다른 모듈에서 네임스페이스 구성을 구성 객체로 사용하려면 구성 객체의 `.asProvider()` 메서드를 활용할 수 있다. 이 메서드는 네임스페이스 구성을 공급자로 변환하며, 변환된 공급자는 사용하려는 모듈의 `forRootAsync()` 메서드에 전달할 수 있다.

```tsx
import databaseConfig from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
  ],
})
```

`.asProvider()` 메서드는 다음과 같은 값을 반환한다.

```tsx
{
  imports: [ConfigModule.forFeature(databaseConfig)],
  useFactory: (configuration: ConfigType<typeof databaseConfig>) => configuration,
  inject: [databaseConfig.KEY]
}
```

이 구조를 통해 네임스페이스가 적용된 구성을 모듈에 원활하게 통합할 수 있다.

### 환경 변수 캐시

`process.env`에 접근하는 것이 느릴 수 있으므로, `ConfigService.get` 메서드의 성능을 향상시키려면 옵션 객체의 `cache` 속성을 설정할 수 있다.

```tsx
ConfigModule.forRoot({
  cache: true,
});
```

### 부분 등록

- 모든 파일을 루트 모듈에 로드하는 대신, `@nestjs/config` 패키지는 각 기능 모듈과 관련된 구성 파일만 참조하는 부분 등록 기능을 제공한다.
- 기능 모듈 내에서 `forFeature()` 정적 메서드를 사용해 부분 등록을 수행할 수 있다.

```tsx
import databaseConfig from './config/database.config';

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
})
export class DatabaseModule {}
```

> 생성자가 아닌 `onModuleInit()` 훅을 사용해 부분 등록된 속성에 접근해야 할 수 있다. 생성자에서 접근하는 경우 해당 구성이 의존하는 모듈이 아직 초기화되지 않았을 수 있지만, `onModuleInit()` 메서드는 의존하는 모든 모듈이 초기화된 후에만 실행되므로 안전하다.

### 스키마 유효성 검사

- 필수 환경 변수가 제공되지 않았거나 특정 유효성 검사 규칙을 충족하지 않는 경우 애플리케이션 시작 시 예외를 발생시키는 것이 일반적이다. 이를 수행하는 두 가지 방법이 있다.
    1. Joi 내장 유효성 검사기
        
        Joi를 사용해 객체 스키마를 정의하고, JavaScript 객체를 해당 스키마에 대해 유효성 검사할 수 있다.
        
    2. 환경 변수를 입력으로 받는 사용자 지정 `validate()` 함수
- Joi 내장 유효성 검사기
    
    ```bash
    yarn add joi
    ```
    
    다음과 같이 Joi 유효성 검사 스키마를 정의하고, 옵션 객체의 `validationSchema` 속성을 통해 전달할 수 있다.
    
    ```tsx
    import * as Joi from 'joi';
    
    @Module({
      imports: [
        ConfigModule.forRoot({
          validationSchema: Joi.object({
            NODE_ENV: Joi.string()
              .valid('development', 'production', 'test', 'provision')
              .default('development'),
            PORT: Joi.number().port().default(3000),
          }),
          validationOptions: {
    	      // 환경 변수에서 unknown 키를 허용할지 여부 제어
    	      // * 기본 값은 true
            allowUnknown: false,
            // true이면 첫 번째 오류 발생 시 유효성 검사 중단, false이면 모든 오류가 반환됨
            // * 기본 값은 false
            abortEarly: true,
          },
        }),
      ],
    })
    export class AppModule {}
    ```
    
    - 기본적으로 모든 스키마 키는 선택 사항으로 간주되며 `default()`로 기본 값을 설정할 수 있다. 또는 `required()`로 해당 환경 변수 값이 반드시 정의되어 있어야 하도록 요구할 수 있다. (없는 경우 예외 발생)
    - 기본적으로 `unknown` 환경 변수(`validationSchema`에 정의되지 않은 변수)는 허용되고 모든 유효성 검사 오류가 보고되는데, 옵션 객체의 `validationOptions` 키를 통해 이러한 동작을 변경할 수 있다.
        
        `validationOptions` 객체를 전달하면 명시적으로 전달하지 않은 모든 설정은 Joi의 표준 기본값으로 설정된다. 따라서 사용자 지정 객체에서 이 두 설정을 모두 지정하는 것이 가장 안전하다.

> 미리 정의된 환경 변수의 유효성 검사를 비활성화하려면 옵션 객체에서 `validatePredefined` 속성을 `false`로 설정해야 한다. 미리 정의된 환경 변수란 `ConfigModule`이 `.env` 파일을 읽기 전에 이미 `process.env` 안에 들어있던 변수를 말한다.

### 사용자 지정 유효성 검사 함수

- 환경 변수를 포함하는 객체를 인수로 받고 유효성 검사를 거친 환경 변수를 포함하는 객체를 반환하는 동기식 유효성 검사 함수를 지정할 수 있다.
- 이렇게 하면 필요한 경우 변수를 변환/변경할 수 있고, 함수에서 오류가 발생하면 애플리케이션이 부트스트랩되지 않는다.
- 이 예제에서는 `class-transformer`와 `class-validator`를 사용한다. 먼저 다음을 정의해야 한다.
    - 유효성 검사 제약 조건을 포함하는 클래스
    - `plainToInstance` 및 `validateSync` 함수를 사용하는 유효성 검사 함수
    
    ```tsx
    // env.validation.ts
    import { plainToInstance } from 'class-transformer';
    import { IsEnum, IsNumber, Max, Min, validateSync } from 'class-validator';
    
    enum Environment {
      Development = "development",
      Production = "production",
      Test = "test",
      Provision = "provision",
    }
    
    class EnvironmentVariables {
      @IsEnum(Environment)
      NODE_ENV: Environment;
    
      @IsNumber()
      @Min(0)
      @Max(65535)
      PORT: number;
    }
    
    export function validate(config: Record<string, unknown>) {
      const validatedConfig = plainToInstance(
        EnvironmentVariables,
        config,
        { enableImplicitConversion: true },
      );
      const errors = validateSync(validatedConfig, { skipMissingProperties: false });
    
      if (errors.length > 0) {
        throw new Error(errors.toString());
      }
      return validatedConfig;
    }
    ```
    
    다음과 같이 `ConfigModule`의 구성 옵션으로 `validate` 함수를 사용해야 한다.
    
    ```tsx
    // app.module.ts
    import { validate } from './env.validation';
    
    @Module({
      imports: [
        ConfigModule.forRoot({
          validate,
        }),
      ],
    })
    export class AppModule {}
    ```
    

### 사용자 정의 getter 함수

`ConfigService`는 키를 사용해 값을 가져오는 `get()` 메서드를 정의한다. 좀 더 자연스러운 코딩 스타일을 위해 getter 함수를 추가할 수도 있다.

```tsx
@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isAuthEnabled(): boolean {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
```

다음과 같이 getter 함수를 사용할 수 있다.

```tsx
@Injectable()
export class AppService {
  constructor(apiConfigService: ApiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // Authentication is enabled
    }
  }
}
```

### 환경 변수 로드 후 호출되는 훅

모듈 구성이 환경 변수에 의존하고 이러한 변수가 `.env` 파일에서 로드되는 경우, `ConfigModule.envVariablesLoaded` 훅을 사용해 파일이 로드되었는지 확인할 수 있다.

```tsx
export async function getStorageModule() {
  await ConfigModule.envVariablesLoaded;
  return process.env.STORAGE === 'S3' ? S3StorageModule : DefaultStorageModule;
}
```

이 구조는 `ConfigModule.envVariablesLoaded` promise가 해결된 후 구성 변수가 로드되도록 보장한다.

### 조건부 모듈 구성

모듈을 조건부로 로드하고 환경 변수에 조건을 지정해야 하는 경우, `ConditionalModule`을 사용할 수 있다.

- 다음의 경우 `.env` 파일의 환경 변수 `USE_FOO`에 `false` 값이 없는 경우에만 `FooModule`을 로드한다.
    
    ```tsx
    @Module({
      imports: [
        ConfigModule.forRoot(),
        ConditionalModule.registerWhen(FooModule, 'USE_FOO'),
      ],
    })
    export class AppModule {}
    ```
    
- boolean 값을 반환하는 함수를 전달해 사용자 지정 조건을 직접 지정할 수도 있다.
    
    ```tsx
    @Module({
      imports: [
        ConfigModule.forRoot(),
        ConditionalModule.registerWhen(
          FooBarModule,
          (env: NodeJS.ProcessEnv) => !!env['foo'] && !!env['bar'],
        ),
      ],
    })
    export class AppModule {}
    ```
    
- `registerWhen` 메서드의 세 번째 옵션 매개변수에 사용자가 설정한 5초 또는 밀리초 단위의 타임아웃 시간 내에 `envVariablesLoaded` 훅이 `true`로 설정되지 않으면 `ConditionalModule`에서 오류가 발생하고 Nest는 애플리케이션 시작을 중단한다.

### 확장 가능한 변수

환경 변수 확장 기능을 사용하면 중첩된 환경 변수를 만들 수 있으며, 한 변수의 정의 내에서 다른 변수를 참조할 수 있다. 

```
APP_URL=mywebsite.com
SUPPORT_EMAIL=support@${APP_URL}
```

> 이 기능을 위해 `@nestjs/config` 패키지는 내부적으로 `dotenv-expand`를 사용한다.

다음과 같이 옵션 객체의 `expandVariables` 속성을 사용해 환경 변수 확장을 활성화하자.

```tsx
@Module({
  imports: [
    ConfigModule.forRoot({
      // ...
      expandVariables: true,
    }),
  ],
})
export class AppModule {}
```

### main.ts에서 사용하기

- 애플리케이션 포트나 CORS 호스트와 같은 변수 저장을 위해 `main.ts` 에서도 설정 파일이 필요할 수 있다.
- `main.ts`에서 설정 파일에 접근하려면 `app.get()` 메서드 다음에 서비스 참조를 사용해야 한다.

```tsx
const configService = app.get(ConfigService);
const port = configService.get('PORT');
```