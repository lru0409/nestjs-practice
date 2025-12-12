# Testing

- 자동화된 테스트는 릴리스 품질 및 성능 목표를 충족하도록 보장하고, 개발자에게 더 빠른 피드백 루프를 제공하여 생산성을 높인다. → 모든 소프트웨어 개발 작업에서 필수적인 부분으로 간주된다.
- 테스트는 단위 테스트, end-to-end(e2e) 테스트, 통합 테스트 등 다양한 유형으로 구성된다.
- Nest는 효과적으로 테스트를 구축하고 자동화할 수 있도록 다음 기능을 제공한다:
    - 컴포넌트에 대한 기본 단위 테스트와 애플리케이션에 대한 E2E 테스트를 자동으로 스캐폴딩함
    - 기본 도구(격리된 모듈/애플리케이션 로더를 빌드하는 테스트 러너 등)을 제공함
    - Jest 및 Supertest와 즉시 통합되면서도 테스트 도구에 구애받지 않음
    - 테스트 환경에서 Nest 종속성 주입 시스템을 사용해 컴포넌트를 쉽게 모의할 수 있음
    
    Nest는 특정 도구를 강제하지 않으므로 원하는 테스트 프레임워크 사용할 수 있다.
    

### 설치

```bash
yarn add -D @nestjs/testing
```

### 단위 테스트

- 다음 예제에서는 `CatsController`, `CatsService` 두 클래스를 테스트한다.
- Jest가 기본 테스트 프레임워크로 제공된다.
- 다음 기본 테스트에서는 클래스를 수동으로 인스턴스화하고 컨트롤러와 서비스가 API 계약을 충족하는지 확인한다.

```tsx
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

<details>
  <summary> Jest 간단 학습 </summary>

- `describe()` : 테스트 그룹, 테스트 묶음
    - 중첩도 가능함
- `beforeEach()` : 각 테스트(it) 실행 전에 무조건 먼저 실행됨
    - 테스트 케이스마다 fresh한 객체를 쓰는 데에 유용함
- `it()` : 실제 테스트 코드(테스트 케이스)
    - 첫 번째 인자로 테스트 설명, 두 번째 인자로 실행할 테스트 함수를 전달
- `jest.spyOn(catsService, 'findAll').mockImplementation(() => result);`
    - 특정 메서드를 감시(spy)하고, 동작을 원하는 대로 바꿔 가짜(mock) 구현을 설정함
- `expect()` : 결과가 예상한 값과 맞는지 검증
    - `toBe()`는 JS의 === 완전 동일 비교임
</details>
<br/>

> 테스트 파일은 테스트하는 클래스 근처에 두자. 테스트 파일에는 `.spec` 또는 `.test` 접미사가 붙어야 한다.

### 테스트 유틸리티

- `@nestjs/testing` 패키지는 더욱 강력한 테스트 프로세스를 지원하는 유틸리티 세트를 제공한다.
- 내장된 `Test` 클래스를 사용해 이전 예제를 다시 작성해보자.
    
    ```tsx
    import { Test } from '@nestjs/testing';
    import { CatsController } from './cats.controller';
    import { CatsService } from './cats.service';
    
    describe('CatsController', () => {
      let catsController: CatsController;
      let catsService: CatsService;
    
      beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [CatsController],
            providers: [CatsService],
          }).compile();
    
        catsService = moduleRef.get(CatsService);
        catsController = moduleRef.get(CatsController);
      });
    
      describe('findAll', () => {
        it('should return an array of cats', async () => {
          const result = ['test'];
          jest.spyOn(catsService, 'findAll').mockImplementation(() => result);
    
          expect(await catsController.findAll()).toBe(result);
        });
      });
    });
    ```
    
    - `Test` 클래스는 전체 Nest 런타임을 모의하는 애플리케이션 실행 컨텍스트를 제공하는 데 유용하다. 모의 및 오버라이딩을 포함해 클래스 인스턴스를 쉽게 관리할 수 있는 훅을 제공한다.
    - `Test` 클래스에는 모듈 메타데이터 객체(`@Module()` 데코레이터에 전달하는 객체와 동일)를 인수로 받는 `createTestingModule()` 메서드가 있다. 이 메서드는 `compile()` 메서드를 가진 `TestingModule` 인스턴스를 반환한다. `compile()` 메서드는 모듈을 종속성으로 부트스트랩하고 테스트할 준비가 된 모듈을 반환한다.
  
    > `compile()` 메서드는 비동기적이므로 대기해야 한다. 모듈이 컴파일되면 `get()` 메서드를 사용해 선언된 모든 정적 인스턴스(컨트롤러 및 공급자)를 검색할 수 있다.
    
- `TestingModule`은 모듈 참조 클래스를 상속하므로 `resolve()` 메서드를 사용해 범위가 지정된 공급자(일시적 또는 요청 범위)를 동적으로 확인할 수 있다.
    
    (`get()` 메서드는 정적 인스턴스, 즉 싱글톤 인스턴스를 가져오는 반면 `resolve()` 메서드는 요청 단위의 일시적 인스턴스를 생성함)
    
    ```tsx
    const moduleRef = await Test.createTestingModule({
      controllers: [CatsController],
      providers: [CatsService],
    }).compile();
    
    catsService = await moduleRef.resolve(CatsService);
    ```
    
- 테스트 목적으로 모든 공급자의 프로덕션 버전을 사용하는 대신, 사용자 지정 공급자로 재정의할 수 있다.예를 들어 라이브 데이터베이스에 연결하는 대신 데이터베이스 서비스를 모의 테스트할 수 있다.

### 자동 모의

- Nest는 누락된 모든 종속성에 적용할 모의 팩토리를 정의할 수 있도록 한다.
- 클래스에 많은 종속성이 있고 모든 종속성을 모의하는 데 시간이 오래 걸리고 많은 설정이 필요한 경우 유용하다.
- 이 기능을 사용하려면 `createTestingModule()`을 `useMocker()` 메서드와 연결해 종속성 모의에 대한 팩토리를 전달해야 한다.
- `jest-mock`을 사용해 일반 모의를 생성하고 `jest.fn()`을 사용해 `CatsService`에 대한 특정 모의를 생성하는 예시다.
    
    ```tsx
    import { ModuleMocker, MockMetadata } from 'jest-mock';
    
    const moduleMocker = new ModuleMocker(global);
    
    describe('CatsController', () => {
      let controller: CatsController;
    
      beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
          controllers: [CatsController],
        })
          .useMocker((token) => {
            const results = ['test1', 'test2'];
            if (token === CatsService) {
              return { findAll: jest.fn().mockResolvedValue(results) };
            }
            if (typeof token === 'function') {
              const mockMetadata = moduleMocker.getMetadata(
                token,
              ) as MockMetadata<any, any>;
              const Mock = moduleMocker.generateFromMetadata(
                mockMetadata,
              ) as ObjectConstructor;
              return new Mock();
            }
          })
          .compile();
    
        controller = moduleRef.get(CatsController);
      });
    });
    ```

> `jest-mock` 대신 `@golevelup/ts-jest`의 `createMock()` 같은 라이브러리로 mock을 자동 생성할 수도 있다.

> Nest 내부 provider인 `REQUEST`와 `INQUIRER`는 이미 Nest context가 직접 제공하는 값이므로 `useMocker`로 mock을 만들 수 없다. (mock으로 덮어쓰고 싶다면 `overrideProvider`를 써라)

### End-to-end 테스트

- e2e 테스트는 클래스와 모듈의 상호작용을 종합적인 수준에서, 즉 최종 사용자가 프로덕션 시스템과 상호작용하는 방식에 더 가깝게 다룬다.
- Nest에서는 Supertest 라는 라이브러리를 사용해 HTTP 요청을 쉽게 시뮬레이션할 수 있도록 지원한다.

```tsx
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET cats`, () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({
        data: catsService.findAll(),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

<details>
  <summary> HTTP 어댑터로 Fastify를 사용하는 경우 약간 다른 구성이 필요하다. </summary>

```tsx
let app: NestFastifyApplication;

beforeAll(async () => {
  app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

it(`/GET cats`, () => {
  return app
    .inject({
      method: 'GET',
      url: '/cats',
    })
    .then((result) => {
      expect(result.statusCode).toEqual(200);
      expect(result.payload).toEqual(/* expectedPayload */);
    });
});

afterAll(async () => {
  await app.close();
});
```
</details>
<br/>

- `createNestApplication()` 메서드를 사용해 전체 Nest 런타임 환경을 인스턴스화한다.
- 주의할 점은 `complie()` 메서드를 사용해 애플리케이션을 컴파일할 때 `HttpAdapterHost`가 정의되지 않는다는 것이다. 이는 컴파일 단계에서 아직 HTTP 어댑터나 서버가 생성되기 않았기 때문이다. 테스트에 `httpAdapter`가 필요한 경우 `createNestApplication()` 메서드를 사용해 애플리케이션 인스턴스를 생성하거나, 이러한 종속성을 피하기 위해 프로젝트를 리팩토링해야 한다.
- 실행 중인 앱에 대한 참조를 `app` 변수에 저장해 HTTP 요청을 시뮬레이션하는 데 사용한다.
- Supertest의 `request()` 함수로 HTTP 테스트를 시뮬레이션한다. 요청이 실행 중인 Nest 앱으로 라우팅되도록 하기 위해 함수에 HTTP 리스너에 대한 참조를 전달한다. → `request(app.getHttpServer())`
- `CatsService`의 대체 구현이 `overrideProvider()`를 통해 제공된다. 마찬가지로 모듈, 가드, 인터셉터, 필터, 파이프를 재정의하기 위해 `overrideModule()`, `overrideGuard()`, `overrideInterceptor()`, `overrideFilter()`, `overrdiePipe()` 메서드를 사용할 수 있다.
    
    `overrideModule()`을 제외한 각 재정의 메서드는 사용자 지정 공급자에 대해 설명된 메서드와 동일한 세 가지 메서드를 가진 객체를 반환한다.
    
    - `useClass` : 인스턴스화될 클래스를 제공
    - `useValue` : 인스턴스를 제공
    - `useFactory` : 인스턴스를 반환하는 함수 제공
    
    `overrideModule()`은 `useModule()` 메서드를 사용해 원래 모듈을 재정의하는 모듈을 제공할 수 있다.
    
    ```tsx
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(CatsModule)
      .useModule(AlternateCatsModule)
      .compile();
    ```
    
- 각 오버라이드 메서드는 `TestingModule` 인스턴스를 반환하므로 Fluent 스타일로 다른 메서드와 연결할 수 있다. 이 체인의 마지막에 `compile()`을 사용해 Nest가 모듈을 인스턴스화하고 초기화하도록 해야 한다.

| `createNestApplication()` | 주어진 모듈을 기반으로 Nest 애플리케이션(`INestApplication` 인스턴스)을 생성하고 반환한다. `init()` 메서드를 사용해 애플리케이션을 수동으로 초기화해야 한다. |
| --- | --- |
| `createNestMicroservice()` | 주어진 모듈을 기반으로 Nest 마이크로서비스(`INestMicroservice` 인스턴스)를 생성하고 반환한다. |
| `get()` | 애플리케이션 컨텍스트에서 사용 가능한 컨트롤러 또는 공급자의 정적(싱글톤) 인스턴스를 가져온다. 모듈 참조 클래스에서 상속된다. |
| `resolve()` | 애플리케이션 컨텍스트에서 사용 가능한 컨트롤러 또는 제공자의 동적으로 생성된 범위 지정 인스턴스를 검색한다. 모듈 참조 클래스에서 상속된다. |
| `select()` | 모듈의 종속성 그래프를 탐색한다. 선택된 모듈에서 특정 인스턴스를 검색하는 데 사용할 수 있다. |

> e2e 테스트 파일을 테스트 디렉터리에 보관해라. 테스트 파일의 확장자는 `.e2e-spec`이어야 한다.

### 전역적으로 등록된 enhancers 재정의

전역적으로 등록된 가드, 파이프, 인터셉터, 필터가 있는 경우 재정의하려면 몇 단게를 더 거쳐야 한다. 원래의 등록 과정은 다음과 같다:

```tsx
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

`APP_*` 토큰을 통해 가드를 다중 공급자로 등록하고 있다. 여기서 JwtAuthGuard를 대체하려면 등록 과정에서 이 슬롯에 있는 기존 공급자를 사용해야 한다.

> Nest가 토큰 뒤에 인스턴스를 생성하는 대신, 등록된 공급자를 참조하도록 `useClass`를 `useExisting`으로 변경한다.

이제 `JwtAuthGuard`는 `TestingModule`을 생성할 때 재정의할 수 있는 일반 공급자로 Nest에 표시된다.

```tsx
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(JwtAuthGuard)
  .useClass(MockAuthGuard)
  .compile();
```

### 요청 범위 인스턴스 테스트

- 요청 범위 공급자는 각 요청에 대해 고유하게 생성된다. 이후 이 인스턴스는 요청 처리 완료 후 가비지 컬렉션된다.
- 컨텍스트 식별자를 미리 생성하고 Nest가 이 특정 ID를 사용해 모든 수신 요청에 대한 하위 트리를 생성하도록 한다. 이렇게 하면 테스트된 요청에 대해 생성된 인스턴스를 검색할 수 있다.
    
    이를 수행하려면 `ContextIdFactory`에서 `jest.spyOn()`을 사용한다:
    
    ```tsx
    const contextId = ContextIdFactory.create();
    jest
      .spyOn(ContextIdFactory, 'getByRequest')
      .mockImplementation(() => contextId);
    ```
    
    이제 `contextId`를 사용해 요청에 대해 단일 생성된 DI 컨테이너 하위 트리에 액세스할 수 있다.
    
    ```tsx
    catsService = await moduleRef.resolve(CatsService, contextId);
    ```

> NestJS는요청 범위 공급자에 대해 다음과 같은 동작을 한다.
> 1. HTTP 요청이 들어오면 Nest는 고유한 ContextId를 만든다.
> 2. 이 ContextId를 키로 하여 DI container sub-tree(독립된 의존성 그래프)를 만든다.
> 3. 이 하위 트리에 요청 범위 공급자들의 인스턴스가 생성된다.
> 4. 요청이 끝나면 삭제된다. (GC 대상)
> 
> 하지만 테스트에선 실제 HTTP 요청이 없으므로 Nest가 알아서 ContextId를 만들지 않는다. 따라서 ContextId를 테스트에서 직접 > 만들고, 앞으로 들어오는 요청은 이 ID를 사용한다고 Nest를 속여야 한다. 그래야 `moduleRef.resolve()`를 통해 요청 범위 > 인스턴스를 가져올 수 있다.