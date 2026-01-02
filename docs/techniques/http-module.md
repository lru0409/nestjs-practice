# HTTP module

- Nest는 Axios를 래핑해 내장된 `HttpModule`을 통해 노출한다.
- `HttpModule`은 HTTP 요청을 수행하는 Axios 기반 메서드를 제공하는 `HttpService` 클래스를 내보낸다.
- HTTP 응답은 `Observables`로 변환된다.

### 설치

```bash
yarn add @nestjs/axios axios
```

### 시작하기

`HttpService`를 사용하기 위해 먼저 `HttpModule`을 가져와야 한다.

```tsx
@Module({
  imports: [HttpModule],
  providers: [CatsService],
})
export class CatsModule {}
```

일반적인 생성자 주입 방식을 사용해 `HttpService`를 주입한다.

```tsx
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Observable<AxiosResponse<Cat[]>> {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
```

> `AxiosResponse`는 `axios` 패키지에서 내보내진 인터페이스이다.

모든 `HttpService` 메서드는 `Observable` 객체로 매핑된 `AxiosResponse`를 반환한다.

### 구성

- Axios는 `HttpService`의 동작을 사용자 지정하기 위한 다양한 옵션으로 구성할 수 있다.
- 기본 Axios 인스턴스를 구성하려면 `HttpModule`을 가져올 때 `register()` 메서드에 선택적 옵션 객체를 전달해야 한다. 이 옵션 객체는 Axios 생성자에 직접 전달된다.

```tsx
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [CatsService],
})
export class CatsModule {}
```

### 비동기 구성

모듈 옵션을 비동기적으로 전달해야 하는 경우 `registerAsync()` 메서드를 사용해야 한다.

- 한 가지 방법은 팩토리 함수를 사용하는 것이다.
    
    ```tsx
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get('HTTP_TIMEOUT'),
        maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
      }),
      inject: [ConfigService],
    });
    ```
    
- `useClass`를 사용해 구성할 수도 있다.
    
    ```tsx
    HttpModule.registerAsync({
      useClass: HttpConfigService,
    });
    ```
    
    `HttpConfigService`는 다음과 같이 `HttpModuleOptionsFactory` 인터페이스를 구현해야 한다. `HttpModule`은 제공된 클래스의 인스턴스화된 객체에서 `createHttpOptions()` 메서드를 호출한다.
    
    ```tsx
    @Injectable()
    class HttpConfigService implements HttpModuleOptionsFactory {
      createHttpOptions(): HttpModuleOptions {
        return {
          timeout: 5000,
          maxRedirects: 5,
        };
      }
    }
    ```
    
- `useExisting` 구문을 사용해 `HttpModule` 내부에 개인 복사본을 만드는 대신 기존 옵션 제공자를 재사용할 수 있다.
    
    ```tsx
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useExisting: HttpConfigService,
    });
    ```
    
- `registerAsync()` 메서드에 `extraProviders` 공급자를 전달할 수 있다. 이러한 공급자는 모듈 공급자와 통합된다.
    
    ```tsx
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useClass: HttpConfigService,
      extraProviders: [MyAdditionalProvider],
    });
    ```
    
    이는 팩토리 함수나 클래스 생성자에서 추가적인 종속성을 제공하려는 경우 유용하다.
    

### Axios를 직접 사용하기

- `HttpModule.register`의 옵션이 충분하지 않다고 생각되거나, `@nestjs/axios`에서 생성한 기본 Axios 인스턴스에 액세스하려면  `HttpService.axiosRef`를 통해 접근할 수 있다.
    
    ```tsx
    @Injectable()
    export class CatsService {
      constructor(private readonly httpService: HttpService) {}
    
      findAll(): Promise<AxiosResponse<Cat[]>> {
        return this.httpService.axiosRef.get('http://localhost:3000/cats');
        //                      ^ AxiosInstance interface
      }
    }
    ```
    

### 전체 예시

`HttpService` 메서드의 반환 값은 `Observable`이므로 `rxjs`의 `firstValueFrom` 또는 `lastValueFrom`을 사용해 요청 데이터를 promise 형태로 가져올 수 있다.

```tsx
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class CatsService {
  private readonly logger = new Logger(CatsService.name);
  constructor(private readonly httpService: HttpService) {}

  async findAll(): Promise<Cat[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<Cat[]>('http://localhost:3000/cats').pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }
}
```