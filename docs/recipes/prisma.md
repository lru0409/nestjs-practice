# Prisma

- Node.js와 TypeScript를 위한 오픈소스 ORM
- 일반 SQL을 작성하거나, (knex.js 같은) SQL 쿼리 빌더, (TypeORM, Sequelize 같은) 다른 ORM 도구 대신 사용 가능함
- Prisma는 현재 PostgreSQL, SQL Server, SQLite, MongoDB, CockroachDB를 지원함
- TypeScript 생태계의 다른 ORM보다 더 높은 수준의 타입 안정성을 제공함

### Prisma 설정

1. 프로젝트에 개발 종속성으로 Prisma CLI 설치
    
    ```bash
    yarn add prisma --save-dev
    ```
    
    설치가 완료되면 다음과 같은 접두사를 붙여 CLI 호출 가능
    
    ```bash
    npx prisma
    
    yarn prisma # yarn의 경우
    ```
    
2. init 명령을 사용해 초기 Prisma 설정을 만듦
    
    ```bash
    npx prisma init
    ```
    
    이 명령은 다음 내용을 포함하는 새 디렉토리를 만듦
    
    - `schema.prisma` : 데이터베이스 연결을 지정하고 데이터베이스 스키마를 포함
    - `.env` : 환경 변수 그룹에 데이터베이스 자격 증명을 저장하는 데 사용되는 dotenv 파일

### Prisma 클라이언트 출력 경로 설정

1. schema.prisma 파일에서 Prisma 클라이언트가 생성될 파일 경로 지정
    
    ```bash
    generator client {
      provider        = "prisma-client-js"
      output          = "../generated/prisma"
    }
    ```
    
2. tsconfig.build.json 파일에 다음과 같이 정의하여 Nest가 Prisma 클라이언트를 빌드에 포함하도록 함
    
    ```json
    {
      "extends": "./tsconfig.json", // tsconfig.json에 있는 설정을 모두 가져오고, 필요하면 override
      "include": ["src", "generated"], // TypeScript 컴파일 대상에 포함할 폴더 지정
      "exclude": ["node_modules", "test", "dist", "**/*spec.ts"] // 컴파일 대상에서 제외할 폴더/파일
    }
    ```
    
    - tsconfig.json : 개발/에디터용
    - tsconfig.build.json : 실제 빌드에 필요한 것만 포함

### 데이터베이스 연결 설정 (PostgreSQL)

- 데이터베이스 연결은 schema.prisma 파일의 datasource 블록에서 구성됨
    
    ```groovy
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
    
- .env 파일에서 `DATABASE_URL` 환경변수를 다음과 같이 조정
    
    ```json
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
    ```
    
    - `SCHEMA`에 무엇을 입력해야 할지 확실하지 않은 경우 public을 기본값으로 입력하는 것이 좋음
- 위 `DATABASE_URL` 환경변수를 사용하도록 하려면 ConfigModule이 구성되어 있어야 함

### **Prisma Migrate를 사용하여 두 개의 데이터베이스 테이블 만들기**

- Prisma Migrate는 Prisma 스키마의 선언적 데이터 모델 정의에 대한 SQL 마이그레이션 파일을 생성함
- 이러한 마이그레이션 파일은 완전히 사용자 정의가 가능하므로 기본 데이터베이스의 추가 기능을 구성할 수 있음
1. 다음 두 모델을 schema.prisma 파일에 추가
    
    ```tsx
    model User {
      id    Int     @default(autoincrement()) @id
      email String  @unique
      name  String?
      posts Post[]
    }
    
    model Post {
      id        Int      @default(autoincrement()) @id
      title     String
      content   String?
      published Boolean? @default(false)
      author    User?    @relation(fields: [authorId], references: [id])
      authorId  Int?
    }
    ```
    
2. SQL 마이그레이션 파일 생성
    
    ```bash
    # prisma/ 경로에서 실행해야 함
    npx prisma migrate dev --name init
    ```
    
    - prisma migrate dev : 개발 환경용 마이그레이션 실행 명령어
    - `—name init` : 생성되는 마이그레이션 폴더 이름
        - 예: /prisma/migrations/20251115064411_init
    - 실행 시 prisma/migrations 디렉토터리에 마이그레이션 파일이 생성됨

### Prisma Client 설치 및 생성

- Prisma Client는 Prisma 모델 정의를 기반으로 생성되는 type safe 데이터베이스 클라이언트임
- Prisma Client는 모델에 맞게 맞춤화된 CRUD 작업을 제공할 수 있음
- 프로젝트에 Prisma Client 설치
    
    ```bash
    yarn add @prisma/client
    ```
    
- 설치 중에 Prisma가 자동으로 `prisma generate` 명령을 실행함. 앞으로는 Prisma 모델을 변경할 때마다 이 명령을 실행하여 Prisma Client를 업데이트해야 함

### NestJS 서비스에서 Prisma Client 사용

- NestJS 애플리케이션을 설정할 때 서비스 내에서 데이터베이스 쿼리를 위한 Prisma Client API를 추상화해야 함
1. PrismaClient 인스턴스화 및 데이터베이스 연결을 담당하는 `PrismaService` 생성
    
    ```tsx
    // src/prisma.service.ts
    
    import { Injectable, OnModuleInit } from '@nestjs/common';
    import { PrismaClient } from '../generated/prisma/client.js';
    
    @Injectable()
    export class PrismaService extends PrismaClient implements OnModuleInit {
      async onModuleInit() {
        await this.$connect();
      }
    }
    ```
    
    - `PrismaClient`를 `PrismaService`가 상속받아 모든 기능을 그대로 쓸 수 있음
    - `OnModuleInit`은 특정 모듈이 초기화될 때 실행되는 인터페이스
    - `onModuleInit`은 선택 사항으로, 생략하면 Prisma는 데이터베이스에 대한 첫 번째 호출에서 지연 연결을 수행함
2. Prisma 스키마에서 User 및 Post 모델에 대한 데이터베이스 호출을 수행하는 데 사용할 수 있는 서비스 작성
    - `UserService` 생성
        
        ```tsx
        // src/user/user.service.ts
        
        import { Injectable } from '@nestjs/common';
        import { PrismaService } from './prisma.service';
        import { User, Prisma } from '../generated/prisma/client.js';
        
        @Injectable()
        export class UserService {
          constructor(private prisma: PrismaService) {}
        
          async user(
            userWhereUniqueInput: Prisma.UserWhereUniqueInput,
          ): Promise<User | null> {
            return this.prisma.user.findUnique({
              where: userWhereUniqueInput,
            });
          }
        
          async users(params: {
            skip?: number;
            take?: number;
            cursor?: Prisma.UserWhereUniqueInput;
            where?: Prisma.UserWhereInput;
            orderBy?: Prisma.UserOrderByWithRelationInput;
          }): Promise<User[]> {
            const { skip, take, cursor, where, orderBy } = params;
            return this.prisma.user.findMany({
              skip,
              take,
              cursor,
              where,
              orderBy,
            });
          }
        
          async createUser(data: Prisma.UserCreateInput): Promise<User> {
            return this.prisma.user.create({ data });
          }
        
          async updateUser(params: {
            where: Prisma.UserWhereUniqueInput;
            data: Prisma.UserUpdateInput;
          }): Promise<User> {
            const { where, data } = params;
            return this.prisma.user.update({
              data,
              where,
            });
          }
        
          async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
            return this.prisma.user.delete({ where });
          }
        }
        ```
        
    - `PostService` 생성
        
        ```tsx
        // src/post/post.service.ts
        
        import { Injectable } from '@nestjs/common';
        import { PrismaService } from './prisma.service';
        import { Post, Prisma } from '../generated/prisma/client.js';
        
        @Injectable()
        export class PostService {
          constructor(private prisma: PrismaService) {}
        
          async post(
            postWhereUniqueInput: Prisma.PostWhereUniqueInput,
          ): Promise<Post | null> {
            return this.prisma.post.findUnique({
              where: postWhereUniqueInput,
            });
          }
        
          async posts(params: {
            skip?: number;
            take?: number;
            cursor?: Prisma.PostWhereUniqueInput;
            where?: Prisma.PostWhereInput;
            orderBy?: Prisma.PostOrderByWithRelationInput;
          }): Promise<Post[]> {
            const { skip, take, cursor, where, orderBy } = params;
            return this.prisma.post.findMany({
              skip,
              take,
              cursor,
              where,
              orderBy,
            });
          }
        
          async createPost(data: Prisma.PostCreateInput): Promise<Post> {
            return this.prisma.post.create({ data });
          }
        
          async updatePost(params: {
            where: Prisma.PostWhereUniqueInput;
            data: Prisma.PostUpdateInput;
          }): Promise<Post> {
            const { where, data } = params;
            return this.prisma.post.update({
              data,
              where,
            });
          }
        
          async deletePost(where: Prisma.PostWhereUniqueInput): Promise<Post> {
            return this.prisma.post.delete({ where });
          }
        }
        ```
        
    - `UserService`와 `PostService`는 Prisma Client에서 사용 가능한 CRUD 쿼리를 래핑함.
    - 실제 애플리케이션에는 이 서비스를 통해 애플리케이션에 비즈니스 로직을 추가할 수 있음. 예를 들어 `UserService` 내에 비밀번호 업데이트를 담당하는 `updatePassword` 메서드를 추가할 수 있음
3. 앱 모듈에 `UserModle`과 `PostModule` 등록
4. `app.conroller.ts`에 REST API 경로 구현

      ```tsx
      import {
        Controller,
        Get,
        Post,
        Put,
        Delete,
        Param,
        Body,
      } from '@nestjs/common';
      import { UserService } from './user/user.service';
      import { PostService } from './post/post.service';
      import {
        User as UserModel,
        Post as PostModel,
      } from '../generated/prisma/client.js';
      
      @Controller()
      export class AppController {
        constructor(
          private readonly userService: UserService,
          private readonly postService: PostService,
        ) {}
      
        @Get('post/:id')
        async getPostById(@Param('id') id: string): Promise<PostModel | null> {
          return this.postService.post({ id: Number(id) });
        }
      
        @Get('feed')
        async getPublishedPosts(): Promise<PostModel[]> {
          return this.postService.posts({
            where: { published: true },
          });
        }
      
        @Get('filtered-posts/:searchString')
        async getFilteredPosts(
          @Param('searchString') searchString: string,
        ): Promise<PostModel[]> {
          return this.postService.posts({
            where: {
              OR: [
                {
                  title: { contains: searchString },
                },
                {
                  content: { contains: searchString },
                },
              ],
            },
          });
        }
      
        @Post('post')
        async createDraft(
          @Body() postData: { title: string; content?: string; authorEmail: string },
        ): Promise<PostModel> {
          const { title, content, authorEmail } = postData;
          return this.postService.createPost({
            title,
            content,
            author: {
              connect: { email: authorEmail },
            },
          });
        }
      
        @Post('user')
        async signupUser(
          @Body() userData: { name?: string; email: string },
        ): Promise<UserModel> {
          return this.userService.createUser(userData);
        }
      
        @Put('publish/:id')
        async publishPost(@Param('id') id: string): Promise<PostModel> {
          return this.postService.updatePost({
            where: { id: Number(id) },
            data: { published: true },
          });
        }
      
        @Delete('post/:id')
        async deletePost(@Param('id') id: string): Promise<PostModel> {
          return this.postService.deletePost({ id: Number(id) });
        }
      }
      ```