# Authentication

구현해 볼 요구사항은 다음과 같다.

- 클라이언트가 사용자 이름과 비밀번호로 인증하면 JWT를 발급한다.
- 이 JWT는 이후 요청에서 인증 헤더의 bearer 토큰으로 전송되어 인증을 증명한다.
- 유효한 JWT가 포함된 요청에먼 접근할 수 있는 보호된 경로를 생성한다.

### 인증 모듈 생성

`AuthModule`을 생성하고, `AuthService`와 `AuthController`를 생성하자. 인증 로직 구현에는 `AuthService`를, 인증 엔드포인트 노출에는 `AuthController`를 사용한다.

```bash
nest g module auth
nest g controller auth
nest g service auth
```

`UserModule`과 `UserService`도 생성하자.

```bash
nest g module users
nest g service users
```

`UserService`를 다음과 같이 임시적으로 구현하자. 실제 앱에서는 이 부분에 `User` 모델과 영속성 계층을 구축해야 한다.

```tsx
export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
}
```

`UsersModule`에서는 `UsersService`를 `exports` 배열에 추가해 이 모듈 외부에서 볼 수 있도록 해야 한다. 그리고 `AuthModule`에서 `UserModule`을 임포트하도록 해야 한다. (곧 `AuthService`에서 사용할 예정)

```tsx
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signIn(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO: Generate a JWT and return it here
    // instead of the user object
    return result;
  }
}
```

> 물론 실제 애플리케이션에서는 비밀번호를 평문으로 저장하는 대신 `bcrypt`와 같은 라이브러리를 활용한다. 이 방식을 사용하면 해시된 비밀번호만 저장하고, 저장된 비밀번호를 들어오는 비밀번호의 해시 버전과 비교하여 비밀번호를 평문으로 저장하거나 노출하지 않을 수 있다.

`AuthController`에서도 `signIn()` 메서드를 추가해보자.

```tsx
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
```

> 이상적으로는 `Record<string, any>` 타입 대신 DTO 클래스를 사용해 요청 본문의 형태를 정의해야 한다.

### JWT 토큰

JWT 요구사항을 지원하기 위해 추가 패키지를 설치해야 한다.

```bash
yarn add @nestjs/jwt
```

> [`@nestjs/jwt`](https://github.com/nestjs/jwt) 패키지는 JWT 조작을 지원하는 유틸리티 패키지다. JWT 토큰 생성 및 검증 기능이 포함된다.

JWT 생성은 `AuthService`에서 처리하자.

```tsx
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.userId, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
```

- `@nestjs/jwt` 라이브러리는 `signAsync()` 함수를 통해 사용자 객체 속성의 일부를 사용해 JWT를 생성한다.
- 생성된 JWT는 `access_token` 속성 하나만을 가진 간단한 객체로 반환된다.
- JWT 표준을 준수하기 위해 `userId` 값을 저장하는 속성 이름을 `sub`로 지정했다.
- `jwtConstants`는 JWT 서명 및 검증 단계 간에 키를 공유하는 데 사용할 것이다.
    
    ```tsx
    // constants/auth
    export const jwtConstants = {
      secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
    };
    ```
    
    > 이 키를 공개적으로 노출하지 마라. 실제 운영 시스템에서는 시크릿 저장소, 환경 변수 또는 configuration service와 같은 적절한 보호 조치를 사용해 키를 보호해야 한다.
    

`AuthModule`을 다음과 같이 작성하자.

```tsx
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

> 작업 간소화를 위해 `JwtModule`을 전역으로 등록한다. 애플리케이션의 다른 곳에서 `JwtModule`을 임포트할 필요가 없다.

> JWT 만료 시간을 60초로 설정했다. 이는 너무 짧은 만료 시간이지만, 더 쉬운 테스트를 위해 이렇게 설정했다. `@nestjs/jwt`가 JWT의 만료 시간을 자동으로 확인하여 애플리케이션에서 직접 만료 시간을 확인하는 번거로움을 덜어준다.

- `curl` 명령을 사용해 라우트를 테스트해보자.
    
    ```bash
    curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
    {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
    ```
    

### 인증 가드 구현

JWT 검증을 통해 엔드포인트를 보호하려면 `AuthGuard`를 사용해야 한다.

```tsx
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

`AuthGuard`를 다음과 같이 적용해 엔드포인트를 보호할 수 있다.

```tsx
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

- `curl` 명령을 사용해 라우트를 테스트해보자.
    
    ```bash
    # GET /profile
    curl http://localhost:3000/auth/profile
    {"statusCode":401,"message":"Unauthorized"}
    
    # POST /auth/login
    curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
    {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."}
    
    # GET /profile using access_token returned from previous step as bearer code
    curl http://localhost:3000/auth/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
    {"sub":1,"username":"john","iat":...,"exp":...}
    ```
    

### 인증 기능을 전역적으로 활성화화기

대부분의 엔드포인트를 기본적으로 보호해야 하는 경우, `@UseGuards()` 데코레이터를 사용하는 대신 인증 가드를 전역 가드로 등록할 수 있다. 이렇게 설정하면 모든 엔드포인트에서 `AuthGuard`를 자동으로 바인딩한다.

```tsx
providers: [
  {
    provide: APP_GUARD,
    useClass: AuthGuard,
  },
],
```

이제 특정 경로를 공개로 선언해보자. 우선 사용자 지정 데코레이터 `Public()`을 만든다. `Public()` 데코레이터를 핸들러 및 클래스에 적용하면, `AuthGuard()`의 영향을 받지 않도록 한다.

```tsx
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

`AuthGuard`에서 `isPublic` 메타데이터가 발견되면 토큰을 검증하지 않고 `true`를 반환하도록 한다.

```tsx
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    ...
  }
}
```

### Passport 통합

- Passport는 가장 인기 있는 Node.js 인증 라이브러리로, 많은 실제 애플리케이션에서 성공적으로 사용되고 있다.
- `@nestjs/passport` 모듈을 사용하면 이 라이브러리를 Nest 애플리케이션과 간단히 통합할 수 있다.
- NestJS와 Passport를 통합하는 방법은 [여기](https://docs.nestjs.com/recipes/passport)를 참고하자.