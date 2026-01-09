# Mapped types

CRUD와 같은 기능을 구축할 때 기본 엔티티 유형의 변형을 만드는 것이 유용한 경우가 많다. Nest는 유형 변환을 수행하는 여러 유틸리티 함수를 제공한다.

### Partial

- 입력 검증 유형을 작성할 때 동일한 유형에 대해 생성 및 업데이트 변형을 작성하는 것이 유용한 경우가 많다. 예를 들어 생성 변형은 모든 필드를 필수로, 업데이트 변형은 모든 필드를 선택 사항으로 지정할 수 있다.
- PartialType() 함수는 입력 유형의 모든 속성이 선택 사항으로 설정된 유형(클래스)을 반환한다.

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

```tsx
export class UpdateCatDto extends PartialType(CreateCatDto) {}
```

### Pick

`PickType()` 함수는 입력된 타입에서 속성 집합을 선택해 새로운 타입(클래스)를 생성한다.

```tsx
export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}
```

### Omit

`OmitType()` 함수는 입력 타입에서 모든 속성을 선택한 다음 특정 키 집합을 제거하여 새로운 타입을 생성한다.

```tsx
export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}
```

### Intersection

`IntersectionType()` 함수는 두 가지 타입을 하나의 새로운 타입(클래스)으로 결합한다.

```tsx
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  breed: string;
}

export class AdditionalCatInfo {
  @ApiProperty()
  color: string;
}
```

```tsx
export class UpdateCatDto extends IntersectionType(
  CreateCatDto,
  AdditionalCatInfo,
) {}
```

### 구성

타입 매핑 유틸리티 함수는 구성 가능하다. 예를 들어 다음은 `CreateCatDto` 타입에서 `name`을 제외한 모든 속성을 갖는 타입(클래스)을 생성하며, 해당 속성은 선택 사항으로 결정된다.

```tsx
export class UpdateCatDto extends PartialType(
  OmitType(CreateCatDto, ['name'] as const),
) {}
```

> 위 함수들은 모두 `@nestjs/swagger` 패키지에서 임포트할 수 있다.