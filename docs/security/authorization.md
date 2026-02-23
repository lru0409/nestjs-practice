# Authorization

- Authorization은 사용자가 무엇을 할 수 있는지 결정하는 프로세스를 말한다.
- 예를 들어 관리자 사용자는 게시물 작성, 편집 및 삭제할 수 있고 일반 사용자는 게시물을 읽는 권한만 있다.
- Authorization은 Authentication과 별개의 개념이지만, Authentication의 메커니즘이 필요하다.

### 기본 RBAC 구현

- 역할 기반 접근 제어(RBAC)는 역할과 권한을 중심으로 정의되는 정책 중립적인 접근 제어 메커니즘이다.
- 먼저 시스템의 역할을 나타내는 Role 열거형을 생성하고, `@Roles()` 데코레이터를 만든다. 이 데코레이터를 사용해 특정 리소스에 접근하는 데 필요한 역할을 지정할 수 있다.
    
    ```tsx
    export enum Role {
      User = 'user',
      Admin = 'admin',
    }
    ```
    
    ```tsx
    import { SetMetadata } from '@nestjs/common';
    import { Role } from '../enums/role.enum';
    
    export const ROLES_KEY = 'roles';
    export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
    ```

> 보다 정교한 시스템에서는 역할을 데이터베이스에 저장하거나 외부 인증 공급자로부터 가져올 수 있다.

- 현재 사용자에게 할당된 역할과 현재 처리 중인 라우트에서 요구하는 실제 역할을 비교하는 `RolesGuard` 클래스를 생성한다.
    
    ```tsx
    import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
    import { Reflector } from '@nestjs/core';
    
    @Injectable()
    export class RolesGuard implements CanActivate {
      constructor(private reflector: Reflector) {}
    
      canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
        if (!requiredRoles) {
          return true;
        }
        const { user } = context.switchToHttp().getRequest();
        return requiredRoles.some((role) => user.roles?.includes(role));
      }
    }
    ```

> 이 예제는 경로 핸들러 수준에서만 역할 존재 여부를 확인한다. 하지만 실제 애플리케이션에서는 여러 작업을 포함하는 핸들러가 있을 수 있으며, 각 작업에는 특정 권한 집합이 필요할 수도 있다. 이 경우 비즈니스 로직 내 어딘가에 역할을 확인하는 메커니즘을 제공해야 하므로, 특정 작업과 권한을 연결하는 중앙 집중식 위치가 없어 유지 관리가 다소 어려워진다.

- 컨트롤러 레벨이나 전역적으로 `RolesGuard`를 등록해야 한다.
- 권한이 부족한 사용자가 엔드포인트를 요청하면 자동으로 403(Forbidden) 응답이 반환된다.

> 다른 오류 응답을 반환하려면 부울 값을 반환하는 대신 특정 예외를 발생시켜야 한다.

### 클레임 기반 권한 부여

- ID가 생성될 때 신뢰할 수 있는 주체가 발행한 하나 이상의 클레임이 할당될 수 있다.
- 클레임은 주체가 무엇을 할 수 있는지 나타내는 이름-값 쌍이다.
- Nest에서 클레임 기반 권한 부여를 구현하려면, RBAC 단계를 그대로 따르되 역할을 확인하는 대신 권한을 비교해야 한다. 마찬가지로 각 엔드포인트는 `@RequirePermissions()` 데코레이터를 사용해 권한을 정의해야 한다.

```tsx
@Post()
@RequirePermissions(Permission.CREATE_CAT)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

> 위 예시에서 `Permission`(RBAC에서 설명한 `Role`과 유사)은 시스템에서 사용 가능한 모든 권한을 포함하는 TypeScript 열거형이다.

### CASL 통합

- CASL은 특정 클라이언트가 접근할 수 있는 리소스를 제한하는 동형 권한 부여 라이브러리다.
- 점진적으로 도입할 수 있도록 설계되었으며, 간단한 클레임 기반 권한 부여부터 모든 기능을 갖춘 주체 및 속성 기반 권한 부여까지 쉽게 확장할 수 있다.
- 시작하려면 `@casl/ability` 패키지를 설치해야 한다.
    
    ```bash
    yarn add @casl/ability
    ```

> 이 예제에서는 CASL을 선택했지만, 선호도와 프로젝트 요구 사항에 따라 `accesscontrol`이나 `acl` 같은 다른 라이브러리르 사용할 수 있다.

- `User`와 `Article` 이라는 두 개의 엔티티 클래스를 정의하자.
    
    ```tsx
    class User {
      id: number;
      isAdmin: boolean;
    }
    ```
    
    ```tsx
    class Article {
      id: number;
      isPublished: boolean;
      authorId: number;
    }
    ```
    
- 예제의 요구사항은 다음과 같다.
    - 관리자는 모든 엔티티를 관리(생성/읽기/업데이트/삭제)할 수 있다.
    - 사용자는 모든 항목에 대해 읽기 전용 접근 권한을 가진다.
    - 사용자는 자신의 게시글을 업데이트할 수 있다. (`article.authorId === userId`)
    - 이미 게시된 게시글은 삭제할 수 없다.
- 사용자가 엔티티에 대해 수행할 수 있는 모든 가능한 작업을 나타내는 `Action` 열거형을 만들자.
    
    ```tsx
    export enum Action {
      Manage = 'manage',
      Create = 'create',
      Read = 'read',
      Update = 'update',
      Delete = 'delete',
    }
    ```
    
    > `manage`는 CASL에서 “모든 행위”를 나타내는 특별한 키워드이다.
    
- CASL 라이브러리를 캡슐화하기 위해 `CaslModule`과 `CaslAbilityFactory`를 생성해보자.
    
    ```bash
    nest g module casl
    nest g class casl/casl-ability.factory
    ```
    
- `CaslAbilityFactory`에 `createForUser()` 메서드를 정의해 사용자에 대한 `Ability` 객체를 생성한다.
    
    ```tsx
    import { MongoAbility, AbilityBuilder, AbilityClass } from '@casl/ability';
    
    type Subjects = InferSubjects<typeof Article | typeof User> | 'all';
    
    export type AppAbility = MongoAbility<[Action, Subjects]>;
    
    @Injectable()
    export class CaslAbilityFactory {
      createForUser(user: User) {
        const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
    
        if (user.isAdmin) {
          can(Action.Manage, 'all'); // read-write access to everything
        } else {
          can(Action.Read, 'all'); // read-only access to everything
        }
    
        can(Action.Update, Article, { authorId: user.id });
        cannot(Action.Delete, Article, { isPublished: true });
    
        return build({
          // Read https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types for details
          detectSubjectType: (item) =>
            item.constructor as ExtractSubjectType<Subjects>,
        });
      }
    }
    ```
    
    > CASL에서 `all`은 “모든 주체”를 나타내는 특별한 키워드이다.
    
    > CASL v6부터 `MongoAbility`는 기본 권한 클래스로 사용되며, MongoDB와 유사한 구문을 사용해 조건 기반 권한을 더 잘 지원한다. 이름과 달리 MongoDB에 국한되지 않고 MongoDB와 유사한 구문으로 작성된 조건과 객체를 비교하는 방식으로 모든 종류의 데이터에서 작동한다.
    
    - 위에서는 `AbilityBuilder` 클래스를 사용해 `MongoAbility` 인스턴스를 생성했다.
    - `can`은 지정된 주체에 대해 작업을 수행할 수 있도록 허용하고, `cannot`은 금지한다.
- `CaslModule` 모듈의 `providers` 및 `exports` 배열에 `CaslAbilityFactory`를 추가하자.
    
    ```tsx
    import { Module } from '@nestjs/common';
    import { CaslAbilityFactory } from './casl-ability.factory';
    
    @Module({
      providers: [CaslAbilityFactory],
      exports: [CaslAbilityFactory],
    })
    export class CaslModule {}
    ```
    
    이렇게 하면 호스트 컨텍스트에 `CaslModule`이 임포트되어 있는 한, 표준 생성자 주입을 통해 모든 클래스에서 `CaslAbilityFactory`를 주입할 수 있다.
    
    ```tsx
    constructor(private caslAbilityFactory: CaslAbilityFactory) {}
    ```
    
    그리고 클래스에서 다음과 같이 사용할 수 있다.
    
    ```tsx
    const user = new User();
    user.isAdmin = false;
    
    const ability = this.caslAbilityFactory.createForUser(user);
    ability.can(Action.Read, Article); // true
    ability.can(Action.Delete, Article); // false
    ability.can(Action.Create, Article); // false
    ```
    
    ```tsx
    const user = new User();
    user.id = 1;
    
    const article = new Article();
    article.authorId = user.id;
    
    const ability = this.caslAbilityFactory.createForUser(user);
    ability.can(Action.Update, article); // true
    
    article.authorId = 2;
    ability.can(Action.Update, article); // false
    ```
    
    이렇게 `MongoAbility` 인스턴스를 사용하면 권한을 매우 읽기 쉬운 방식으로 확인할 수 있다.
    

### 고급: PoliciesGuard 구현

- 사용자가 특정 권한 부여 정책을 충족하는지 확인하는 좀 더 정교한 가드를 구축하는 방법을 알아보자.
- 라우트 핸들러 별로 정책 검사를 지정할 수 있는 메커니즘을 제공하자. 객체와 함수를 모두 지정할 것이다. 다음과 같이 정책 핸들러에 대한 인터페이스를 정의한다.
    
    ```tsx
    import { AppAbility } from '../casl/casl-ability.factory';
    
    interface IPolicyHandler {
      handle(ability: AppAbility): boolean;
    }
    
    type PolicyHandlerCallback = (ability: AppAbility) => boolean;
    
    export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
    ```
    
- `@CheckPolicies()` 데코레이터를 만들어 특정 리소스에 접근하기 위해 충족해야 하는 정책을 지정할 수 있도록 한다.
    
    ```tsx
    export const CHECK_POLICIES_KEY = 'check_policy';
    export const CheckPolicies = (...handlers: PolicyHandler[]) =>
      SetMetadata(CHECK_POLICIES_KEY, handlers);
    ```
    
- 경로 핸들러에 바인딩된 모든 정책 핸들러를 추출하고 실행하는 `PoliciesGuard`를 만들어 보자.
    
    ```tsx
    @Injectable()
    export class PoliciesGuard implements CanActivate {
      constructor(
        private reflector: Reflector,
        private caslAbilityFactory: CaslAbilityFactory,
      ) {}
    
      async canActivate(context: ExecutionContext): Promise<boolean> {
        const policyHandlers =
          this.reflector.get<PolicyHandler[]>(
            CHECK_POLICIES_KEY,
            context.getHandler(),
          ) || [];
    
        const { user } = context.switchToHttp().getRequest();
        const ability = this.caslAbilityFactory.createForUser(user);
    
        return policyHandlers.every((handler) =>
          this.execPolicyHandler(handler, ability),
        );
      }
    
      private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
        if (typeof handler === 'function') {
          return handler(ability);
        }
        return handler.handle(ability);
      }
    }
    ```
    
    > 이 예제에서는 `request.user`에 사용자 인스턴스가 포함되어 있다고 가정했다. 실제 앱에서는 사용자 지정 인증 가드에서 해당 연결을 생성해야 할 것이다.
    
- `PoliciesGuard`를 테스트하려면 다음과 같이 정책 핸들러를 등록해보면 된다.
    
    ```tsx
    @Get()
    @UseGuards(PoliciesGuard)
    @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Article))
    findAll() {
      return this.articlesService.findAll();
    }
    ```
    
    대안적으로 `IPolicyHandler` 인터페이스를 구현하는 클래스를 정의하고 사용할 수도 있다.
    
    ```tsx
    export class ReadArticlePolicyHandler implements IPolicyHandler {
      handle(ability: AppAbility) {
        return ability.can(Action.Read, Article);
      }
    }
    ```
    
    ```tsx
    @Get()
    @UseGuards(PoliciesGuard)
    @CheckPolicies(new ReadArticlePolicyHandler())
    findAll() {
      return this.articlesService.findAll();
    }
    ```