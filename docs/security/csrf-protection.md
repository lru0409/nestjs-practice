# CSRF Protection
- 교차 사이트 요청 위조(CSRF 또는 XSRF)는 신뢰할 수 있는 사용자가 웹 애플리케이션에 권한 없는 명령을 전송하는 공격 유형이다.
- 이러한 공격을 방지하려면 csrf-csrf 패키지를 사용할 수 있다.

### Express와 함께 사용 (기본값)

필요한 패키지를 설치하자.

```bash
yarn add csrf-csrf
```

설치한 `csrf-csrf` 미들웨어를 전역 미들웨어로 등록한다.

```tsx
import { doubleCsrf } from 'csrf-csrf';
// ...
// somewhere in your initialization file
const {
  invalidCsrfTokenError, // This is provided purely for convenience if you plan on creating your own middleware.
  generateToken, // Use this in your routes to generate and provide a CSRF hash, along with a token cookie and token.
  validateRequest, // Also a convenience if you plan on making your own middleware.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf(doubleCsrfOptions);
app.use(doubleCsrfProtection);
```

### Fastify와 함께 사용

필요한 패키지를 설치하자.

```bash
yarn add @fastify/csrf-protection
```

다음과 같이 `@fastify/csrf-protection` 플러그인을 등록하자.

```tsx
import fastifyCsrf from '@fastify/csrf-protection';
// ...
// somewhere in your initialization file after registering some storage plugin
await app.register(fastifyCsrf);
```