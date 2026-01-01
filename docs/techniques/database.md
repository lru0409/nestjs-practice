# Database

- Nest는 모든 SQL, NoSQL 데이터베이스와 쉽게 통합할 수 있다.
- MikroORM, Sequelize, Knex.js, TypeORM, Prisma와 같은 범용 Node.js 데이터베이스 통합 라이브러리 또는 ORM을 사용해 더 높은 추상화 수준에서 작업할 수 있다.

### TypeORM 통합

- `@nestjs/typeorm` 패키지가 제공된다.
- TypeORM은 TypeScript에서 사용할 수 있는 가장 성숙한 객체 관계형 매퍼(ORM)이다.
- TypeORM은 MySQL, PostgreSQL, Oracle, Microsoft SQL server, SQLite 같은 SQL 데이터베이스는 물론, MongoDB 같은 NoSQL 데이터베이스도 지원한다. 아래의 절차는 지원하는 모든 데이터베이스에 동일하게 적용되며, 선택한 데이터베이스에 맞는 클라이언트 API 라이브러리만 설치하면 된다. 여기서는 MySQL을 예로 든다.

```bash
yarn add @nestjs/typeorm typeorm mysql2
```

`TypeOrmModule`을 루트 `AppModule`로 가져올 수 있다.

```tsx
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

> `synchronize: true`는 프로덕션 환경에선 사용해선 안 된다. 프로덕션 데이터가 손실될 수 있다.

`forRoot()` 메서드는 TypeORM 패키지의 [`DataSource`](https://typeorm.io/docs/data-source/data-source-options/) 생성자가 지원하는 모든 구성 속성을 지원하며, 아래에 설명된 몇 가지 추가 구성 속성이 있다.

| `retryAttempts` | 데이터베이스 연결 시도 횟수 (기본값: 10) |
| --- | --- |
| `retryDelay` | 연결 재시도 간격(밀리초) (기본값: 3000) |
| `autoLoadEntities` | `true`로 설정하면 엔티티가 자동으로 로드됨 (기본값: false) |

TypeORM `DataSource` 및 `EntityManager` 객체를 전체 프로젝트에서 (임포트하지 않고도) 가져올 수 있게 된다. 예를 들면 다음과 같다:

```tsx
import { DataSource } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
```

### Repository 패턴

- TypeORM은 repository 패턴을 지원한다. 각 엔티티는 자체 repository를 가진다. 이러한 repository는 데이터베이스 데이터 소스에서 가져올 수 있다.
- 예시로 `User` 엔티티를 정의해보자.
    
    ```tsx
    // user.entity.ts
    import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
    
    @Entity()
    export class User {
      @PrimaryGeneratedColumn()
      id: number;
    
      @Column()
      firstName: string;
    
      @Column()
      lastName: string;
    
      @Column({ default: true })
      isActive: boolean;
    }
    ```
    
    > 엔티티에 대해 더 알고 싶다면 [여기](https://typeorm.io/docs/entity/entities/)를 참고하자.
    
    이 엔티티 파일은 (`UsersModule`과 관련된 모든 파일이 포함되어 있는) `users` 디렉터리에 있다. 엔티티 파일 위치는 자유롭게 정할 수 있지만, 해당 도메인 근처에 생성하는 것이 권장된다.
    
- `User` 엔티티를 사용하려면 TypeORM에 해당 엔티티를 알려주기 위해 옵션 객체의 `entities` 배열에 엔티티를 추가해야 한다.
    
    ```tsx
    // app.module.ts
    import { Module } from '@nestjs/common';
    import { TypeOrmModule } from '@nestjs/typeorm';
    import { User } from './users/user.entity';
    
    @Module({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: 'root',
          database: 'test',
          entities: [User],
          synchronize: true,
        }),
      ],
    })
    export class AppModule {}
    ```
    
- `UsersModule`에서는 `forFeature()` 메서드를 사용해 현재 스코프에 등록된 repository를 정의한다. 이를 바탕으로 `@InjectRepository()` 데코레이터를 사용해 `UsersService`에 `UsersRepository`를 주입할 수 있다.
    
    ```tsx
    // users.module.ts
    import { Module } from '@nestjs/common';
    import { TypeOrmModule } from '@nestjs/typeorm';
    import { UsersService } from './users.service';
    import { UsersController } from './users.controller';
    import { User } from './user.entity';
    
    @Module({
      imports: [TypeOrmModule.forFeature([User])],
      providers: [UsersService],
      controllers: [UsersController],
    })
    export class UsersModule {}
    ```
    
    ```tsx
    // users.service.ts
    import { Injectable } from '@nestjs/common';
    import { InjectRepository } from '@nestjs/typeorm';
    import { Repository } from 'typeorm';
    import { User } from './user.entity';
    
    @Injectable()
    export class UsersService {
      constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
      ) {}
    
      findAll(): Promise<User[]> {
        return this.usersRepository.find();
      }
    
      findOne(id: number): Promise<User | null> {
        return this.usersRepository.findOneBy({ id });
      }
    
      async remove(id: number): Promise<void> {
        await this.usersRepository.delete(id);
      }
    }
    ```
    
- `TypeOrmModule.forFeature`를 임포트하는 모듈 외부에서 해당 repository를 사용하려면, 해당 repository에서 생성된 공급자를 다시 내보내야 한다. 다음과 같이 전체 모듈을 내보내면 된다.
    
    ```tsx
    // users.module.ts
    import { Module } from '@nestjs/common';
    import { TypeOrmModule } from '@nestjs/typeorm';
    import { User } from './user.entity';
    
    @Module({
      imports: [TypeOrmModule.forFeature([User])],
      exports: [TypeOrmModule]
    })
    export class UsersModule {}
    ```
    
    이렇게 다른 모듈에서 `UsersModule`을 임포트하면 해당 모듈의 공급자에서 `@InjectRepository(User)`를 사용할 수 있다.
    
    ```tsx
    // users-http.module.ts
    import { Module } from '@nestjs/common';
    import { UsersModule } from './users.module';
    import { UsersService } from './users.service';
    import { UsersController } from './users.controller';
    
    @Module({
      imports: [UsersModule],
      providers: [UsersService],
      controllers: [UsersController]
    })
    export class UserHttpModule {}
    ```
    

### 관계(Relations)

- 관계는 두 개 이상의 테이블 간에 설정되는 연결이다.
- 관계는 각 테이블의 공통 필드를 기반으로 하여, 종종 기본 키와 외래 키를 포함한다.
- 관계에는 세 가지 유형이 있다.
    
    
    | `One-to-one` | 기본 테이블의 모든 행은 외부 테이블에서 단 하나의 관련 행만 가진다. 이 유형의 관계를 정의하려면 `@OneToOne()` 데코레이터를 사용한다. |
    | --- | --- |
    | `One-to-many / Many-to-one` | 기본 테이블에서 모든 행은 외부 테이블에서 하나 이상의 관련 행을 가진다. 이 유형의 관계를 정의하려면 `@OneToMany()` 및 `@ManyToOne()` 데코레이터를 사용한다. |
    | `Many-to-many` | 기본 테이블의 모든 행은 외부 테이블에서 여러 개의 관련 행을 가지며, 외부 테이블의 모든 행은 기본 테이블에서 여러 개의 관련 행을 가진다. 이 유형의 관계를 정의하려면 `@ManyToMany()` 데코레이터를 사용한다. |
- 엔티티 간 관계를 정의하려면 위 데코레이터를 사용한다. 예를 들어 각 사용자가 여러 장의 사진을 가질 수 있도록 정의하려면 `@OneToMany()` 데코레이터를 사용한다.
    
    ```tsx
    // user.entity.ts
    import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
    import { Photo } from '../photos/photo.entity';
    
    @Entity()
    export class User {
      @PrimaryGeneratedColumn()
      id: number;
    
      @Column()
      firstName: string;
    
      @Column()
      lastName: string;
    
      @Column({ default: true })
      isActive: boolean;
    
      @OneToMany(type => Photo, photo => photo.user)
      photos: Photo[];
    }
    ```

> TypeORM에서 관계에 대해 더 알고 싶다면 [여기](https://typeorm.io/docs/relations/relations/)를 참고하자.

### 엔티티 자동 로드

- 옵션 객체의 `entities` 배열에 엔티티를 수동으로 추가하는 것은 번거로울 수 있다. 또한 애플리케이션의 도메인 경계가 무너지고, 구현의 세부 정보가 애플리케이션의 다른 부분으로 유출될 수 있다.
- 이 문제를 해결하기 위해 엔티티를 자동으로 로드할 수 있다. 옵션 객체의 `autoLoadEntities` 속성을 `true`로 설정하면 된다.
    
    ```tsx
    // app.module.ts
    import { Module } from '@nestjs/common';
    import { TypeOrmModule } from '@nestjs/typeorm';
    
    @Module({
      imports: [
        TypeOrmModule.forRoot({
          ...
          autoLoadEntities: true,
        }),
      ],
    })
    export class AppModule {}
    ```
    
    이 옵션을 지정하면 `forFeature()`를 통해 등록된 모든 엔티티가 `entities` 배열에 자동으로 추가된다.

> `forFeature()`를 통해 등록되지 않았지만 (관계를 통해) 참조만 되는 엔티티는 `autoLoadEntities` 설정에 포함되지 않는다는 점에 유의하자.

### 엔티티 정의 분리

데코레이터를 사용해 모델에서 바로 엔티티와 해당 열을 정의하는 대신, 엔티티 스키마를 사용해 별도의 파일에 정의할 수도 있다.

```tsx
import { EntitySchema } from 'typeorm';
import { User } from './user.entity';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  relations: {
    photos: {
      type: 'one-to-many',
      target: 'Photo', // the name of the PhotoSchema
    },
  },
});
```

> `target` 옵션을 제공하는 경우 `name` 옵션 값은 `target` 값과 동일해야 한다. `target`을 제공하지 않으면 임의의 이름을 사용할 수 있다.

`Entity`가 필요한 모든 곳에서 `EntitySchema` 인스턴스를 사용할 수 있다. 

```tsx
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSchema])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

### TypeORM 트랜잭션

- 데이터베이스 트랜잭션은 데이터베이스 관리 시스템 내에서 데이터베이스에 대해 수행되는 작업 단위를 나타낸다.
- TypeORM 트랜잭션을 처리하는 다양한 전략이 있으며, 트랜잭션을 완벽하게 제어할 수 있는 `QueryRunner` 클래스 사용을 권장한다.
- 일반적인 방법으로 `DataSource` 객체를 클래스에 주입해야 한다.
    
    ```tsx
    @Injectable()
    export class UsersService {
      constructor(private dataSource: DataSource) {}
    }
    ```
    
    이 객체를 사용해 트랜잭션을 생성할 수 있다.
    
    ```tsx
    async createMany(users: User[]) {
      const queryRunner = this.dataSource.createQueryRunner();
    
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.manager.save(users[0]);
        await queryRunner.manager.save(users[1]);
    
        await queryRunner.commitTransaction();
      } catch (err) {
        // since we have errors lets rollback the changes we made
        await queryRunner.rollbackTransaction();
      } finally {
        // you need to release a queryRunner which was manually instantiated
        await queryRunner.release();
      }
    }
    ```

> `dataSource`는 `QueryRunner`를 생성하는 데에만 사용된다. 하지만 이 클래스를 테스트하려면 전체 `DataSource` 객체를 모킹해야 한다. 따라서 트랜잭션 관리에 필요한 메서드만 포함하는 인터페이스를 정의하고, 헬퍼 팩토리 클래스(예: `QueryRunnerFactory`)를 사용하는 것을 권장한다. 이 방법을 사용하면 해당 메서드들을 모킹하는 것이 훨씬 간단해진다.

- 또는 `DataSource` 객체의 `transaction` 메서드를 사용해 콜백 방식 접근법을 사용할 수도 있다.
    
    ```tsx
    async createMany(users: User[]) {
      await this.dataSource.transaction(async manager => {
        await manager.save(users[0]);
        await manager.save(users[1]);
      });
    }
    ```

> 단일 CRUD인 경우 `repository` 사용, 여러 테이블을 묶어서 처리해야 하는 경우 `dataSource.transaction` 사용, 트랜잭션 생명주기를 직접 제어해야 하는 경우 `QueryRunner` 사용

### 구독자

- TypeORM 구독자를 사용하면 특정 엔티티 이벤트를 수신할 수 있다.
    
    (엔티티가 insert 되기 전/후, update 되기 전/후, remove 되기 전/후)
    
    ```tsx
    import {
      DataSource,
      EntitySubscriberInterface,
      EventSubscriber,
      InsertEvent,
    } from 'typeorm';
    import { User } from './user.entity';
    
    @EventSubscriber()
    export class UserSubscriber implements EntitySubscriberInterface<User> {
      constructor(dataSource: DataSource) {
        dataSource.subscribers.push(this);
      }
    
      listenTo() {
        return User; // 이 Subscriber가 관심 있는 엔티티 (안 쓰면 모든 엔티티 이벤트를 다 받음)
      }
    
      beforeInsert(event: InsertEvent<User>) {
        console.log(`BEFORE USER INSERTED: `, event.entity);
      }
    }
    ```

> 이벤트 구독자는 요청 범위로 지정할 수 없다.

- 이제 `UserSubscriber` 클래스를 `providers` 배열에 추가한다.
    
    ```tsx
    import { Module } from '@nestjs/common';
    import { TypeOrmModule } from '@nestjs/typeorm';
    import { User } from './user.entity';
    import { UsersController } from './users.controller';
    import { UsersService } from './users.service';
    import { UserSubscriber } from './user.subscriber';
    
    @Module({
      imports: [TypeOrmModule.forFeature([User])],
      providers: [UsersService, UserSubscriber],
      controllers: [UsersController],
    })
    export class UsersModule {}
    ```
    

### 마이그레이션

- 마이그레이션은 데이터베이스 스키마를 점진적으로 업데이트하여 애플리케이션의 데이터 모델과 동기화 상태를 유지하면서 데이터베이스의 기존 데이터를 보존하는 방법을 제공한다.
- 마이그레이션 클래스는 Nest 애플리케이션 소스 코드와 분리되어 있다. 마이그레션 클래스의 수명 주기는 TypeORM CLI에서 관리한다.
- 마이그레이션에 대한 자세한 내용은 [이 문서](https://typeorm.io/docs/migrations/why/)를 참고하자.

### 여러 데이터베이스

- `Album` 엔티티가 별도의 데이터베이스에 저장되어 있다고 가정해보자.
    
    ```tsx
    const defaultOptions = {
      type: 'postgres',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'db',
      synchronize: true,
    };
    
    @Module({
      imports: [
        TypeOrmModule.forRoot({
          ...defaultOptions,
          host: 'user_db_host',
          entities: [User],
        }),
        TypeOrmModule.forRoot({
          ...defaultOptions,
          name: 'albumsConnection',
          host: 'album_db_host',
          entities: [Album],
        }),
      ],
    })
    export class AppModule {}
    ```

> 데이터 소스의 `name`을 설정하지 않으면 `default` 값이 사용된다. 이름이 지정되지 않은 연결이 여러 개 있거나, 동일한 이름을 가진 연결이 여러 개 있으면 덮여쓰여지므로 주의해야 한다.

> `TypeOrmModule.forRootAsync`를 사용하는 경우 `useFactory` 외부에서 데이터 소스 이름을 설정해야 한다. 예를 들면 다음과 같다.
> 
> ```tsx
> TypeOrmModule.forRootAsync({
>   name: 'albumsConnection',
>   useFactory: ...,
>   inject: ...,
> }),
> ```
> 
> (`forRoot()`는 설정이 즉시 고정되는 반면, `forRootAsync()`는 `useFactory`의 함수에서 반환하는 값으로 설정이 결정됨)

- `User` 및 `Album` 엔티티가 각각 고유한 데이터 소스와 함께 등록된 경우, `@InjectRepository` 데코레이터에서 사용할 데이터 소스 지정을 위해 데이터 소스 이름을 지정해야 한다. 지정하지 않으면 `default`가 사용된다.
    
    ```tsx
    @Module({
      imports: [
        TypeOrmModule.forFeature([User]),
        TypeOrmModule.forFeature([Album], 'albumsConnection'),
      ],
    })
    export class AppModule {}
    ```
    
- 특정 데이터 소스에 대한 `DataSource` 또는 `EntityManager`를 주입할 수도 있다.
    
    ```tsx
    @Injectable()
    export class AlbumsService {
      constructor(
        @InjectDataSource('albumsConnection')
        private dataSource: DataSource,
        @InjectEntityManager('albumsConnection')
        private entityManager: EntityManager,
      ) {}
    }
    ```
    
- 또한 공급자에게 어떤 `DataSource`든 주입할 수 있다.
    
    ```tsx
    @Module({
      providers: [
        {
          provide: AlbumsService,
          useFactory: (albumsConnection: DataSource) => {
            return new AlbumsService(albumsConnection);
          },
          inject: [getDataSourceToken('albumsConnection')],
        },
      ],
    })
    export class AlbumsModule {}
    ```
    

### 테스팅

- 클래스가 데이터 소스 인스턴스에서 가져온 레포지토리에 의존할 때, 모의 레포지토리를 생성해야 한다.
- 이를 위해 사용자 지정 공급자를 설정한다. 등로된 레포지토리는 `<EntityName>Repository` 토큰으로 자동으로 표현된다.
- `@nestjs/typeorm` 패키지는 주어진 엔티티를 기반으로 준비된 토큰을 반환하는 `getRepositoryToken()` 함수를 제공한다.

```tsx
@Module({
  providers: [
    UsersService,
    {
      provide: getRepositoryToken(User),
      useValue: mockRepository,
    },
  ],
})
export class UsersModule {}
```

- 이제 `UsersRepository` 대신 대체 `mockRepository` 객체가 사용된다.

### 비동기 구성

- 레포지토리 모듈 옵션을 정적으로 전달하는 대신 비동기적으로 전달해야 할 수도 있다.
- `forRootAsync()` 메서드는 비동기 구성을 처리하는 방법을 제공한다.
    
    ```tsx
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('HOST'),
        port: +configService.get('PORT'),
        username: configService.get('USERNAME'),
        password: configService.get('PASSWORD'),
        database: configService.get('DATABASE'),
        entities: [],
        synchronize: true,
      }),
      inject: [ConfigService], // inject를 통해 의존성을 주입할 수 있다.
    });
    ```
    
- 또는 `useClass` 구문을 사용할 수도 있다.
    
    ```tsx
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    });
    ```
    
    위 코드는 `TypeOrmModule` 내부에 `TypeOrmConfigService` 인스턴스를 생성하고, `createTypeOrmOptions()`를 호출하여 옵션 객체를 제공한다.
    
    이때 `TypeOrmConfigService`는 다음과 같이 `TypeOrmOptionsFactory` 인터페이스를 구현해야 한다.
    
    ```tsx
    @Injectable()
    export class TypeOrmConfigService implements TypeOrmOptionsFactory {
      createTypeOrmOptions(): TypeOrmModuleOptions {
        return {
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: 'root',
          database: 'test',
          entities: [],
          synchronize: true,
        };
      }
    }
    ```
    
- `TypeOrmModule` 내부에 `TypeOrmConfigService`가 생성되는 것을 방지하고 다른 모듈에서 가져온 공급자를 사용하려면 `useExisting` 구문을 사용할 수 있다.
    
    ```tsx
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useExisting: ConfigService,
    });
    ```
    
    이 구문은 `useClass`와 동일하게 작동하지만, 중요한 차이점은 새 `ConfigService` 모듈을 생성하는 대신 기존 `CondfigService`를 재사용한다는 것이다.

> `name` 속성이 `useFactory`, `useClass`, `useValue` 속성과 동일한 레벨에 정의되어 있는지 확인해라. 그래야 Nest가 적절한 주입 토큰 아래에 데이터 소스를 올바르게 등록할 수 있다.

### 사용자 지정 데이터 소스 팩토리

`useFactory`, `useClass`, `useExisting`을 활용한 비동기 구성과 함께 선택적으로 `dataSourceFactory` 함수를 지정할 수 있다. 이 함수를 사용하면 `TypeOrmModule`이 데이터 소스를 생성하는 대신 사용자가 직접 TypeORM 데이터 소스를 제공할 수 있다.

```tsx
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  // Use useFactory, useClass, or useExisting
  // to configure the DataSourceOptions.
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  // dataSource receives the configured DataSourceOptions
  // and returns a Promise<DataSource>.
  dataSourceFactory: async (options) => {
    const dataSource = await new DataSource(options).initialize();
    return dataSource;
  },
});
```

`dataSourceFactory`는 비동기 구성 중 설정된 `DataSourceOptions`를 인수로 받아 TypeORM 데이터 소스를 확인하는 Promise를 반환한다.

> `dataSourceFactory`는 `TypeOrmModule`이 `DataSource`를 만들어주는 기본 방식을 직접 바꾸고 싶을 때 쓰는 훅이다.

### Sequelize 통합

- TypeORM 대신 `@nestjs/sequelize` 패키지로 Sequelize ORM을 사용할 수 있다. 또한 엔티티를 선언적으로 정의하기 위한 추가 데코레이터 세트를 제공하는 `sequelize-typescript` 패키지를 활용한다.
- Sequelize는 PostgreSQL, MySQL, Microsoft SQL Server, SQLite, MariaDB 등 다양한 SQL 데이터베이스를 지원한다. 여기서는 MySQL를 예로 든다.
- 필요한 종속성을 설치하자.
    
    ```bash
    yarn add @nestjs/sequelize sequelize sequelize-typescript mysql2
    yarn add -D @types/sequelize
    ```
    
- `SequelizeModule`을 루트 `AppModule`로 가져올 수 있다.
    
    ```tsx
    // app.module.ts
    import { Module } from '@nestjs/common';
    import { SequelizeModule } from '@nestjs/sequelize';
    
    @Module({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: 'root',
          database: 'test',
          models: [],
        }),
      ],
    })
    export class AppModule {}
    ```
    
    `forRoot()` 메서드는 Sequelize 생성자가 제공하는 모든 구성 속성을 지원하며, 아래에 설명된 몇 가지 추가 구성 속성이 있다.
    
    | `retryAttempts` | 데이터베이스 연결 시도 횟수 (기본값: 10) |
    | --- | --- |
    | `retryDelay` | retryDelay 연결 재시도 간격(밀리초) (기본값: 3000) |
    | `autoLoadModels` | true인 경우 모델이 자동으로 로드됨 (기본값: false) |
    | `keepConnectionAlive` | true인 경우 애플리케이션 종료 시 연결이 닫히지 않음 (기본값: false) |
    | `synchronize` | true인 경우 자동으로 로드된 모델이 동기화됨 (기본값: true) |
- Sequelize 객체를 (임포트하지 않고) 전체 프로젝트에 주입할 수 있다. 예를 들면:
    
    ```tsx
    import { Injectable } from '@nestjs/common';
    import { Sequelize } from 'sequelize-typescript';
    
    @Injectable()
    export class AppService {
      constructor(private sequelize: Sequelize) {}
    }
    ```
    

### 모델

- Sequelize는 Active Record 패턴을 구현한다. 이 패턴을 사용하면 모델 클래스를 직접 사용해 데이터베이스와 상호작용할 수 있다.
- `User` 모델을 정의해보자.
    
    ```tsx
    // user.model.ts
    import { Column, Model, Table } from 'sequelize-typescript';
    
    @Table
    export class User extends Model {
      @Column
      firstName: string;
    
      @Column
      lastName: string;
    
      @Column({ defaultValue: true })
      isActive: boolean;
    }
    ```
    
    모델 파일의 위치는 자유롭게 정할 수 있지만, 도메인 근처에 생성하는 것이 권장된다.
    
- `User` 모델을 사용하려면 옵션 객체의 `models` 배열에 모델을 추가해야 한다.
    
    ```tsx
    import { User } from './users/user.model';
    
    @Module({
      imports: [
        SequelizeModule.forRoot({
    	    ...
          models: [User],
        }),
      ],
    })
    export class AppModule {}
    ```
    
- `forFeature()` 메서드를 사용해 현재 스코프에 등록할 모델을 정의할 수 있다. 이를 바탕으로 `@InjectModel` 데코레이터를 사용해 `UserModel`을 `UserService`에 주입할 수 있다.
    
    ```tsx
    import { User } from './user.model';
    
    @Module({
      imports: [SequelizeModule.forFeature([User])],
      providers: [UsersService],
      controllers: [UsersController],
    })
    export class UsersModule {}
    ```
    
    ```tsx
    import { Injectable } from '@nestjs/common';
    import { InjectModel } from '@nestjs/sequelize';
    import { User } from './user.model';
    
    @Injectable()
    export class UsersService {
      constructor(
        @InjectModel(User)
        private userModel: typeof User,
      ) {}
    
      async findAll(): Promise<User[]> {
        return this.userModel.findAll();
      }
    
      findOne(id: string): Promise<User> {
        return this.userModel.findOne({
          where: {
            id,
          },
        });
      }
    
      async remove(id: string): Promise<void> {
        const user = await this.findOne(id);
        await user.destroy();
      }
    }
    ```
    
- `SequelizeModule.forFeature`를 임포트하는 모듈 외부에서 모델을 사용하려면 공급자를 다시 내보내야 한다. 다음과 같이 전체 모듈을 내보내면 된다.
    
    ```tsx
    import { SequelizeModule } from '@nestjs/sequelize';
    import { User } from './user.entity';
    
    @Module({
      imports: [SequelizeModule.forFeature([User])],
      exports: [SequelizeModule]
    })
    export class UsersModule {}
    ```
    
    이제 다른 모듈에서 `UsersModule`을 임포트하면 해당 모듈의 공급자에서 `@InjectModel(User)`를 사용할 수 있다.
    

### 관계(Relations)

모델에서 관계를 정의하려면 데코레이터를 사용한다. 예를 들어 각 사용자가 여러 장의 사진을 가질 수 있도록 정의하려면 `@HasMany()` 데코레이터를 사용한다.

```tsx
import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Photo } from '../photos/photo.model';

@Table
export class User extends Model {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;

  @HasMany(() => Photo)
  photos: Photo[];
}
```

> Sequelize의 연관 관계에 대해 더 자세히 알아보려면 [여기](https://github.com/sequelize/sequelize-typescript#model-association)를 참고하자.

### 자동 모델 로드

옵션 객체의 `models` 배열에 모델을 수동으로 추가하는 대신, `autoLoadModels` 및 `synchronize` 속성을 모두 `true`로 설정하며 모델을 자동으로 로드할 수 있다.

```tsx
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...
      autoLoadModels: true,
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

### Sequelize 트랜잭션

Sequelize 트랜잭션을 처리하는 다양한 전략이 있으며, 아래는 관리형 트랜잭션(자동 콜백)의 샘플 구현이다.

```tsx
@Injectable()
export class UsersService {
  constructor(private sequelize: Sequelize) {}
}
```

```tsx
async createMany() {
  try {
    await this.sequelize.transaction(async t => {
      const transactionHost = { transaction: t };

      await this.userModel.create(
          { firstName: 'Abraham', lastName: 'Lincoln' },
          transactionHost,
      );
      await this.userModel.create(
          { firstName: 'John', lastName: 'Boothe' },
          transactionHost,
      );
    });
  } catch (err) {
    // Transaction has been rolled back
    // err is whatever rejected the promise chain returned to the transaction callback
  }
}
```

> 이 클래스를 테스트스를 테스트하려면 전체 `Sequelize` 객체를 모킹해야 한다. 따라서 트랜잭션 관리에 필요한 메서드만 포함하는 인터페이스를 정의하고 헬퍼 팩토리 클래스(예: `TransactionRunner`)를 사용하는 것을 권장한다. 이 방법을 사용하면 해당 메서드를 모킹하는 것이 훨씬 간단해진다.

### 마이그레이션

Sequelize 마이그레션에 대한 자세한 내용을 [여기](https://sequelize.org/docs/v6/other-topics/migrations/#installing-the-cli)를 참고하자.

> 여러 데이터베이스, 테스팅, 비동기 구성은 TypeORM 내용과 동일함
>