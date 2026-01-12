# Security

특정 작업에 어떤 보안 메커니즘을 사용해야 하는지 정의하려면 `@ApiSecurity()` 데코레이터를 사용한다.

```tsx
@ApiSecurity('basic')
@Controller('cats')
export class CatsController {}
```

애플리케이션을 실행하기 전에 `DocumentBuilder`를 사용해 기본 문서에 보안 정의를 추가해야 한다.

```tsx
const options = new DocumentBuilder().addSecurity('basic', {
  type: 'http',
  scheme: 'basic',
});
```

가장 널리 사용되는 인증 기법 중 일부(예: `basic` 및 `bearer`)는 내장되어 있으므로 보안 메커니즘을 수동으로 정의할 필요가 없다.

### Basic 인증

basic 인증을 활성화하려면 `@ApiBaseAuth()`를 사용해라.

```tsx
@ApiBasicAuth()
@Controller('cats')
export class CatsController {}
```

```tsx
const options = new DocumentBuilder().addBasicAuth();
```

- Basic 인증 방식
    - HTTP 프로토콜이 원래부터 제공하는 가장 간단한 인증 방식
    - 요청할 때 헤더에 아이디와 비밀번호를 Base64로 인코딩해서 보내는 방식
    - 암호화되지 않은 상태로 보내므로 HTTPS를 반드시 사용해야 함
    - 현대 애플리케이션에서는 보통 잘 안 씀 (보안 취약)
    
    ```tsx
    Authorization: Basic dXNlcjpwYXNzMTIz
    ```
    

### Bearer 인증

bearer 인증을 활성화하려면 `@ApiBearerAuth()`를 사용한다.

```tsx
@ApiBearerAuth()
@Controller('cats')
export class CatsController {}
```

```tsx
const options = new DocumentBuilder().addBearerAuth();
```

- Bearer 인증 방식
    - 토큰 기반 인증의 가장 흔한 형태
    - Authorization 헤더에 Bearer + 토큰을 넣어서 인증하는 방식
    - OAuth Access Token, JWT Token 등이 모두 Bearer token 방식임
    - 가장 널리 사용되는 최신 방식
    
    ```tsx
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    ```
    

### OAuth2 인증

OAuth2를 활성화하려면 `@ApiOAuth2()`를 사용한다.

```tsx
@ApiOAuth2(['pets:write'])
@Controller('cats')
export class CatsController {}
```

```tsx
const options = new DocumentBuilder().addOAuth2();
```

- OAuth2 인증 방식
    - Google Login, GitHub Login 같은 3rd party 인증의 표준 프로토콜
    - 클라이언트는 승인을 받아 Access Token을 발급받고, 요청 시 이 토큰을 Bearer 방식으로 보냄

### 쿠키 인증

쿠키 인증을 활성화하려면 `@ApiCookieAuth()`를 사용한다.

```tsx
@ApiCookieAuth()
@Controller('cats')
export class CatsController {}
```

```tsx
const options = new DocumentBuilder().addCookieAuth('optional-session-id');
```

- 쿠키 인증 방식
    - 세션 기반 인증
    - 서버가 발급한 세션 ID를 쿠키에 저장하고, 브라우저가 쿠키를 자동으로 보내서 인증