# Module

- `@Module()` 데코레이터가 달린 클래스
- 대부분의 애플리케이션에는 여러 모듈이 있으며, 각 모듈은 밀접하게 관련된 기능 집합을 캡슐화함
- 루트 모듈은 Nest가 애플리케이션 그래프를 구축하는 시작점 역할을 함
    - 이 그래프는 module과 provider 간의 관계와 종속성을 확인하는 데 사용하는 내부 구조임
- 모듈은 다음 속성으로 해당 모듈을 설명함
    - `providers`: Nest 인젝터에 의해 인스턴스화되고 최소한 이 모듈 전체에서 공급될 수 있음
    - `controllers`: 이 모듈에 정의된 컨트롤러 세트
    - `imports`: 이 모듈에 필요한 공급자를 내보내는 다른 모듈 목록
    - `exports`: 이 모듈로부터 제공되는 providers의 하위 집합 (다른 모듈에서 사용 가능)
- 모듈은 provider를 캡슐화함 → 현재 모듈의 일부이거나, imported된 모듈에서 명시적으로 내보낸 provider만 주입 가능

### 기능 모듈

- 동일한 애플리케이션 도메인을 담당한다면 하나의 기능 모듈로 그룹화하는 것이 좋음
- 기능 모듈은 특정 기능과 관련된 코드를 구성하여 명확한 경계를 유지하는 게 도움이 됨
- 특정 기능 모듈과 관련된 모든 항목을 한 디렉토리에 두어 해당 기능 모듈 파일에 등록하고, 이 모듈을 루트 모듈로 가져와야 함

### 공유된 모듈

- 모듈은 기본적으로 싱글턴이므로 여러 모듈 간에 공급자의 동일한 인스턴스를 손쉽게 공유 가능
- 다른 모듈에서 공유하려는 provider는 모듈의 `exports` 배열에 추가해 내보내야 함
    - 이후 해당 provider를 내보내는 모듈을 import하는 모든 모듈에서 그 provider 사용 가능
    - 필요한 모든 모듈에 그 provider를 직접 등록하면, 각 모듈의 별도의 인스턴스를 갖게 됨

### 모듈 다시 내보내기

모듈은 내부 공급자를 내보낼 수도 있고, 가져온 모듈을 다시 내보낼 수도 있음

```tsx
@Module({
  imports: [CommonModule],
  exports: [CommonModule],
})
export class CoreModule {}
```

- 이제 이 모듈을 가져오는 다른 모듈에서도 `CommonModule`을 사용할 수 있음

### 종속성 주입

모듈 클래스는 공급자를 주입할 수도 있음

```tsx
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {
  constructor(private catsService: CatsService) {}
}
```

- 그러나 모듈 클래스 자체는 순환 종속성으로 인해 공급자로 주입될 수 없음

### 전역 모듈

- 어디에서나 사용할 수 있는 공급자 세트(헬퍼, 데이터베이스 연결 등)를 제공하려는 경우 `@Global()` 데코레이터를 사용해 모듈을 전역으로 만듦
- 전역 모듈은 루트 모듈이나 코어 모듈에 의해 한 번만 등록되어야 함
- 전역 모듈의 provider는 imports 배열에서 그 모듈을 가져오지 않아도 사용 가능

```tsx
import { Module, Global } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Global()
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

> 모든 것을 전역으로 만드는 것은 설계 관행으로 권장되지 않는다. 전역 모듈은 보일러플레이트를 줄이는 게 도움이 될 수 있지만, 일반적으로 imports 배열을 사용해 모듈의 API를 명확한 방식으로 사용할 수 있도록 하는 것이 더 좋다. 이러한 접근 방식은 더 나은 구조와 유지 관리성을 제공하며, 모듈의 필수 부분만 다른 모듈과 공유하고 관련 없는 부분 간의 불필요한 결합은 방지한다.

### 동적 모듈

- 동적 모듈을 사용하면 런타임에 구성 가능한 모듈을 생성할 수 있음
- 특정 옵션이나 구성에 따라 공급자를 생성할 수 있는, 사용자 정의 가능한 모듈을 제공해야 할 때 유용함

```tsx
import { Module, DynamicModule } from '@nestjs/common';
import { createDatabaseProviders } from './database.providers';
import { Connection } from './connection.provider';

@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);
    return {
	    // global: true -> 동적 모듈을 전역 범위에서 등록하고 싶은 경우
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
```

> `forRoot()` 메서드는 동기 또는 비동기식으로 동적 모듈을 반환할 수 있다.

- 이 모듈은 기본적으로 `Connection` 공급자를 정의하지만, `forRoot()` 메서드에 전달된 엔티티 및 옵션 객체에 따라 공급자 컬렉션을 추가로 노출함
- 동적 모듈에서 반환되는 속성은 기본 모듈 메타데이터를 재정의하는 것이 아니라 확장함
- 동적 모듈을 가져오고 구성하는 방법
    
    ```tsx
    import { Module } from '@nestjs/common';
    import { DatabaseModule } from './database/database.module';
    import { User } from './users/entities/user.entity';
    
    @Module({
      imports: [DatabaseModule.forRoot([User])],
      exports: [DatabaseModule], // 동적 모듈을 다시 내보낼 때는 forRoot() 메서드 호출을 생략 가능
    })
    export class AppModule {}
    ```