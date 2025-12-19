# Providers

- service, repository, factory, helper와 같은 많은 기본 Nest 클래스는 provider로 취급될 수 있다.
- 핵심 아이디어는 종속성으로 주입될 수 있어 객체가 서로 다양한 관계를 형성할 수 있다는 것이다.
- 컨트롤러는 HTTP 요청을 처리하고 더 복잡한 작업은 provider에게 위임해야 한다.

### Service

- 데이터 저장 및 검색을 처리하고, 애플리케이션 로직을 관리하는 서비스는 provider로 정의하기 적합함
- `@Injectable()` : 클래스에 메타데이터를 첨부해 Nest IoC 컨테이너에서 관리할 수 있는 클래스임을 알림
- 서비스는 클래스 생성자를 통해 주입됨

### 종속성 주입

- Nest는 의존성 주입(Dependency Injection)이라는 강력한 디자인 패턴을 기반으로 구축됨
- Nest는 TypeScript 타입 정보를 기반으로 필요한 의존성을 자동으로 찾아 주입할 수 있음
- 여러 컨트롤러에서 한 Provider가 필요해도 1번만 생성되고 동일 인스턴스가 공유됨

### 범위

- provider는 일반적으로 애플리케이션 수명 주기와 일치하는 수명을 가짐
    
    → 애플리케이션이 부트스트랩될 때 모든 provider가 인스턴스화되고, 애플리케이션이 종료되면 모든 provider가 삭제됨
    
- provider의 수명을 요청 범위로 설정할 수도 있음

### 선택적 provider

`@Opitonal()`을 생성자의 시그니처에 사용해 해당 종속성을 선택 사항으로 간주할 수 있음

```tsx
import { Injectable, Optional, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
	// HTTP_OPTIONS 라는 토큰을 가진 provider 인스턴스를 달라. 그 provider가 없어도 에러를 내지 말고 undefined를 넣어달라
  constructor(@Optional() @Inject('HTTP_OPTIONS') private httpClient: T) {}
}
```

### 속성 기반 주입

```tsx
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  @Inject('HTTP_OPTIONS')
  private readonly httpClient: T;
}
```

- 생성자 기반 주입은 상속 구조가 깊거나 전달해야 할 의존성이 많으면 번거로움
- 속성에 직접 `@Inject()`를 사용하면 토큰 이름이 동일한 provider를 찾아 해당 속성에 자동으로 주입해줌

> 클래스가 다른 클래스를 상속하지 않는 경우 일반적으로 생성자 기반 주입을 사용하는 것이 더 좋다. 생성자는 필요한 의존성을 명확히 보여주기 때문에 코드 가독성과 유지보수성이 더 뛰어난다.

### Provider 등록

모듈 파일에서 `services` 배열에 서비스를 등록하여 주입을 처리할 수 있도록 해야 함

```tsx
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';
import { CatsService } from './cats/cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class AppModule {}
```