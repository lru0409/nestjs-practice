# Encryption and Hashing

암호화는 평문을 암호문으로 변환하는 정보 인코딩 과정이다. 이상적으로는 권한이 있는 당사자만 암호문을 해독하여 평문으로 되돌릴 수 있다. 양방향 기능이며 암호화된 내용은 적절한 키를 사용해 복호화할 수 있다.

해싱은 수학적 알고리즘에 따라 주어진 키를 새로운 값으로 변환하는 과정이다. 해싱이 완료되면 출력에서 입력으로 되돌아가는 건 불가능해야 한다.

### 암호화

- Node.js는 문자열, 숫자, 버퍼, 스트림 등을 암호화하고 복호화하는 데 사용 가능한 내장 [crypto 모듈](https://nodejs.org/api/crypto.html)을 제공한다.
- 예를 들어 AES(고급 암호 시스템) `aes-256-ctr` 알고리즘의 CTR 암호화 모드를 사용해보자.

```tsx
import { createCipheriv, randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const iv = randomBytes(16);
const password = 'Password used to generate key';

// The key length is dependent on the algorithm.
// In this case for aes256, it is 32 bytes.
const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
const cipher = createCipheriv('aes-256-ctr', key, iv);

const textToEncrypt = 'Nest';
const encryptedText = Buffer.concat([
  cipher.update(textToEncrypt),
  cipher.final(),
]);
```

- `encryptedText` 값을 다음과 같이 복호화할 수 있다.

```tsx
import { createDecipheriv } from 'node:crypto';

const decipher = createDecipheriv('aes-256-ctr', key, iv);
const decryptedText = Buffer.concat([
  decipher.update(encryptedText),
  decipher.final(),
]);
```

### 해싱

- 해싱에는 bcrypt 또는 argon2 패키지를 사용하는 것은 권장한다.
- 예를 들어 bcrypt를 사용해 임의의 비밀번호를 해싱해보자. 필요한 패키지를 설치하고 다음과 같이 해시 함수르 사용할 수 있다.

```bash
npm i bcrypt
npm i -D @types/bcrypt
```

```tsx
import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;
const password = 'random_password';
const hash = await bcrypt.hash(password, saltOrRounds);
```

- 솔트를 생성하려면 `genSalt` 함수를 사용하자.
    
    ```tsx
    const salt = await bcrypt.genSalt();
    ```
    
- 비밀번호를 비교/확인하려면 `compare` 함수를 사용하자.
    
    ```tsx
    const isMatch = await bcrypt.compare(password, hash);
    ```