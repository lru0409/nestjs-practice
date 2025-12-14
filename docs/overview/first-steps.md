# First steps

### Nest CLI를 사용해 프로젝트 스캐폴딩

```bash
npm i -g @nestjs/cli
nest new . # 프로젝트 폴더 안에서
```
> 더 엄격한 기능 세트를 갖춘 TypeScript 프로젝트를 만드려면 `nest new` 명령에 `—strict` 플래그 전달

- yarn run start 시 http://localhost:3000/에서 접근 가능
- 초기 `src/` 디렉토리의 핵심 파일
    - `app.controller.ts` : 단일 경로를 갖춘 기본 컨트롤러
    - `app.controller.spec.ts` : 컨트롤러에 대한 단위 테스트
    - `app.module.ts` : 애플리케이션의 루트 모듈
    - `app.service.ts` : 단일 방법을 갖춘 기본 서비스
    - `main.ts` : NestFactory를 사용하여 Nest 애플리케이션 인스턴스를 생성하는 진입점 파일
        - NestFactory의 create() 정적 메서드는 INestApplication 인터페이스를 충족하는 애플리케이션 객체를 반환함

### 플랫폼

- Nest는 플랫폼 독립적인 프레임워크를 지향함
- 여러 플랫폼에서 재사용 가능한 논리적 부분을 생성 가능
- 기술적으로 Nest는 어댑터만 생성되면 모든 Node.js HTTP 프레임워크와 호환됨
- 기본적으로 `express`와 `fastify`가 지원됨
- NestFactory.create() 메서드에 유형을 전달하면, app 객체는 해당 플랫폼에서만 사용할 수 있는 메서드를 갖게 됨

```tsx
// express
const app = await NestFactory.create<NestExpressApplication>(AppModule);
// fastify
const app = await NestFactory.create<NestFastifyApplication>(AppModule);
```

### 애플리케이션 실행

다음 명령을 실행해 인바운드 HTTP 요청을 수신하는 애플리케이션을 시작할 수 있음

```bash
yarn run start
yarn run start:dev # 파일의 변경 사항을 감시해 서버를 자동으로 다시 컴파일하고 로드하려는 경우
```

> 개발 프로세스를 가속화하려면(20배 빠른 빌드) `-b swc` 플래그를 전달해 SWC 빌더를 사용 가능
> - `yarn run start -- -b swc`
> - SWC 빌더: Rust로 작성된 초고속 JavaScript/TypeScript 컴파일러

### 린팅 및 포맷팅

생성된 Nest 프로젝트에는 코드 린터와 포매터(각각 eslint와 prettier)가 모두 사전 설치되어 제공됨

```bash
# Lint and autofix with eslint
yarn run lint

# Format with prettier
yarn run format
```