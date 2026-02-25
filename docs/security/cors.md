# CORS

- CORS(교차 출처 리소스 공유)는 다른 도메인에서 리소스를 요청할 수 있도록 하는 메커니즘이다.
- Nest는 내부적으로 플랫폼에 따라 Express [cors](https://github.com/expressjs/cors) 또는 Fasify [@fastify/cors](https://github.com/fastify/fastify-cors) 패키지를 사용한다.

### 시작하기

CORS를 활성화하려면 Nest 애플리케이션 객체에서 enableCors() 메서드를 호출하면 된다.

```tsx
const app = await NestFactory.create(AppModule);
app.enableCors();
await app.listen(process.env.PORT ?? 3000)
```

- `enableCors()` 메서드는 구성 객체를 선택적으로 인수로 받는다. 이 객체에 사용 가능한 속성은 공식 [CORS](https://github.com/expressjs/cors#configuration-options) 문서에 설명되어 있다. 또는 비동기적으로 구성 객체를 정의할 수 있는 콜백 함수를 전달할 수도 있다.
- `create()` 메서드의 옵션 객체를 통해 CORS를 활성화할 수도 있다. cors 속성을 true로 전달하면 CORS가 활성화되며, cors 속성 값으로 CORS 구성 객체나 콜백 함수를 전달해 동작을 사용자 지정할 수 있다.
    
    ```tsx
    const app = await NestFactory.create(AppModule, { cors: true });
    await app.listen(process.env.PORT ?? 3000);
    ```