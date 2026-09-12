# BU-TING Mobile

나만의 부산 여행 가이드 **부팅(Bu-Ting)** React Native 앱입니다.

언어 선택 → 여행 취향 온보딩 → OAuth 로그인 후, AI 일정·카카오맵·행사 구역·여행기·마이페이지 등을 이용할 수 있습니다.

## 기술 스택

| 영역 | 스택 |
|------|------|
| 앱 | React Native 0.85 · React 19 · TypeScript |
| UI | NativeWind v4 (Tailwind CSS) |
| 상태 | Zustand + AsyncStorage persist |
| 지도 | WebView + Kakao Map JavaScript SDK |
| 로그인 | Google / Kakao 네이티브 SDK → 백엔드 OAuth (`id_token`) |
| 품질 | ESLint · Prettier · Jest · Maestro E2E |

## 사전 요구사항

- **Node.js** ≥ 22.11.0
- **JDK** 17+
- **Android Studio** (Android) · **Xcode** (iOS, macOS)

[React Native 환경 설정](https://reactnative.dev/docs/set-up-your-environment)은 공식 문서를 참고하세요.

---

## 빠른 시작

### 1. 저장소 클론 & 의존성 설치

```bash
npm install
```

`postinstall`에서 아래가 자동 실행됩니다.

- `kakao:sync` · `api:sync` · `oauth:sync` — `.env` → 로컬 생성 파일 동기화
- `patch-package`
- `hooks:install` — 커밋 전 보안 검사 훅 설치

### 2. 환경 변수 설정

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

`.env`에 필요한 키를 채운 뒤 동기화 스크립트를 실행합니다.

```bash
npm run api:sync      # API_BASE_URL, OAuth client 설정
npm run oauth:sync    # AndroidManifest, Info.plist, oauth_strings.xml
npm run kakao:sync    # 카카오맵 WebView 설정
```

> `.env`와 동기화로 생성되는 파일은 **git에 올리지 않습니다.** 템플릿은 `.env.example`만 커밋합니다.

### 3. Metro & 앱 실행

**터미널 1 — Metro**

```bash
npm start
# NativeWind 변경 후 캐시 이슈 시
npm start -- --reset-cache
```

**터미널 2 — 앱**

```bash
npm run android    # Android (USB 권장, adb reverse 자동)
npm run ios        # iOS (macOS)
```

---

## 환경 변수

`.env.example`에 전체 목록과 설명이 있습니다. 자주 쓰는 항목만 정리합니다.

| 변수 | 용도 |
|------|------|
| `API_BASE_URL` | 백엔드 API (OAuth, 여행 설문, 프로필 등) |
| `GOOGLE_OAUTH_WEB_CLIENT_ID` | Google 로그인 · 백엔드 `id_token` 검증 |
| `GOOGLE_OAUTH_IOS_CLIENT_ID` | iOS Google Sign-In |
| `GOOGLE_OAUTH_ANDROID_CLIENT_ID_FOR_*` | Android Google Sign-In (debug/release) |
| `KAKAO_REST_API_KEY` | 카카오 OAuth client_id |
| `KAKAO_NATIVE_APP_KEY` | 카카오 로그인 SDK |
| `KAKAO_JAVASCRIPT_KEY` | 앱 내 카카오맵 WebView |
| `NGROK_AUTHTOKEN` | Metro 터널 (`start:tunnel`) |

### OAuth 로그인

- Google · Kakao: 네이티브 SDK에서 **`id_token`**을 받아 `POST /api/v1/auth/oauth/login`으로 전송합니다.
- 키 입력 후 반드시 `npm run oauth:sync`를 실행해 네이티브 매니페스트를 갱신하세요.
- 네이버는 앱 등록 전까지 비활성화 (`src/constants/auth/oauthProviders.ts`).

### 카카오맵

앱 내 지도(일정, 행사 구역, 짐 보관소 등)는 **WebView + 카카오맵 JS SDK**입니다.

1. 카카오 콘솔에서 **Web** 플랫폼 활성화
2. `.env`에 `KAKAO_JAVASCRIPT_KEY` 설정
3. `npm run kakao:sync`

---

## Metro 연결

| 방식 | Metro | 앱 | 비고 |
|------|-------|-----|------|
| **USB** (권장) | `npm start` | `npm run android` | `adb reverse` 자동. `npm run connect:android`로 상태 확인 |
| **같은 Wi‑Fi** | `npm run start:lan` | `npm run android` | Dev Menu → Debug server host에 `192.168.x.x:8081` 입력 |
| **다른 네트워크** | `npm run start:tunnel` | `REACT_NATIVE_PACKAGER_HOSTNAME` 설정 후 실행 | ngrok Authtoken 필요 |

**터널 (ngrok) 최초 설정**

```bash
npm run ngrok:auth -- 여기에_토큰
npm run start:tunnel
```

PowerShell 예시:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME="출력된-ngrok-호스트"
npm run android
```

**자주 나는 오류**

- **`Unable to load script`** — Metro가 안 떠 있거나, 폰이 PC Metro에 연결되지 않은 경우. USB + `npm start` 조합을 먼저 확인하세요.
- **`EADDRINUSE` (8081)** — 기존 `node` 프로세스 종료 후 Metro 재시작.

---

## npm 스크립트

### 앱 실행

| 명령 | 설명 |
|------|------|
| `npm start` | Metro (localhost) |
| `npm run start:lan` | Metro — LAN IP 노출 |
| `npm run start:tunnel` | Metro — ngrok 터널 |
| `npm run connect:android` | adb reverse · Metro 연결 상태 확인 |
| `npm run android` | Android 빌드 & 실행 |
| `npm run android:avd` | 지정 AVD로 실행 |
| `npm run ios` | iOS 빌드 & 실행 |

### Android 릴리스 (Play Store)

Play Console 업로드용 **AAB**를 만듭니다. 현재 알파 기준은 아래와 같습니다.

| 항목 | 값 |
|------|-----|
| `versionName` | `1.0.0-alpha` (`android/app/build.gradle`) |
| `versionCode` | `1` (스토어에 올릴 때마다 **증가** 필요) |
| `compileSdk` / `targetSdk` | **36** (Android 16) |
| `minSdk` | 24 |
| 산출물 | `android/app/build/outputs/bundle/release/app-release.aab` |

#### 1. 릴리스 서명 준비

```bash
# Windows
copy android\gradle.properties.example android\gradle.properties

# macOS / Linux
cp android/gradle.properties.example android/gradle.properties
```

1. 릴리스 키스토어를 `android/app/`에 둡니다 (예: `buting.keystore`).  
   `*.keystore`는 gitignore 대상입니다 (`debug.keystore` 제외).
2. `android/gradle.properties`에 서명 값을 채웁니다.

```properties
MYAPP_RELEASE_STORE_FILE=buting.keystore
MYAPP_RELEASE_KEY_ALIAS=your-key-alias
MYAPP_RELEASE_STORE_PASSWORD=
MYAPP_RELEASE_KEY_PASSWORD=
```

> `gradle.properties`와 키스토어는 **커밋하지 않습니다.**

JDK는 **17**을 권장합니다. `org.gradle.java.home`을 로컬 JDK 경로에 맞게 수정하세요.

#### 2. 사전 동기화

릴리스 빌드 전에 `.env` 기준 네이티브/설정 파일을 맞춥니다.

```bash
npm run api:sync
npm run oauth:sync
npm run kakao:sync
```

Google 로그인은 **release**용 `GOOGLE_OAUTH_ANDROID_CLIENT_ID_FOR_RELEASE`가 패키지·서명 SHA-1과 맞는지 확인하세요.

#### 3. AAB 빌드

```bash
cd android
./gradlew bundleRelease
# Windows
gradlew.bat bundleRelease
```

성공 시:

```
android/app/build/outputs/bundle/release/app-release.aab
```

APK가 필요하면:

```bash
./gradlew assembleRelease
# 출력: android/app/build/outputs/apk/release/app-release.apk
```

#### 4. 버전 올릴 때

다음 스토어 업로드 전 `android/app/build.gradle`의 `defaultConfig`를 수정합니다.

```gradle
versionCode 2          // 이전보다 반드시 큰 정수
versionName "1.0.0-alpha.2"  // 표시용 문자열
```

`package.json`의 `"version"`도 맞춰 두면 관리하기 쉽습니다.

---

### 설정 동기화

| 명령 | 설명 |
|------|------|
| `npm run api:sync` | `.env` → `apiConfig.ts`, `apiBaseUrl.ts` |
| `npm run oauth:sync` | `.env` → OAuth 네이티브 설정·매니페스트 |
| `npm run kakao:sync` | `.env` → `src/kakaoMap/config.ts` |
| `npm run map:sync` | 부산 지도 SVG 경로 추출 |
| `npm run zone-boundaries:sync` | 구역 경계 GeoJSON 생성 |
| `npm run hooks:install` | pre-commit 보안 훅 설치 |

### 개발·품질

| 명령 | 설명 |
|------|------|
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` | Jest |
| `npm run e2e` | Maestro E2E (기기/에뮬레이터, debug 빌드) |
| `npm run e2e:smoke` | Maestro 스모크 태그 (`setup` + 홈/탭) |
| `npm run ngrok:auth` | ngrok Authtoken 등록 |
| `npm run icons:generate` | 앱 아이콘 생성 |

---

## 프로젝트 구조

```
.
├── src/
│   ├── components/     # 공통·화면별 UI
│   ├── constants/      # 카피·메뉴·API 경로 예시 등
│   ├── hooks/
│   ├── kakaoMap/       # WebView 지도 코어·오버레이
│   ├── navigation/
│   ├── screens/        # 화면 (홈, 일정, 피드, 마이페이지, 설정…)
│   ├── services/       # auth, user, travel survey, plan AI…
│   ├── stores/         # Zustand (auth, app, plan…)
│   ├── types/
│   └── utils/
├── scripts/            # sync·빌드·git hooks
├── android/ · ios/     # 네이티브 (OAuth 매니페스트는 sync로 생성)
├── __tests__/
├── .maestro/           # Maestro E2E 플로우
├── .env.example        # 환경 변수 템플릿 (커밋 O)
└── .env                # 로컬 비밀 (커밋 X)
```

### git에 올리지 않는 파일

`.gitignore` 및 pre-commit 훅으로 보호합니다.

- `.env`, `.env.local` 등 (`.env.example` 제외)
- `src/constants/api/apiConfig.ts`, `apiBaseUrl.ts`
- `src/constants/auth/oauthConfig.ts`
- `src/kakaoMap/config.ts`
- `android/app/src/main/AndroidManifest.xml`, `ios/.../Info.plist` (OAuth sync 결과)
- `android/gradle.properties` (로컬 JVM·릴리스 서명)
- `android/app/*.keystore` (`debug.keystore` 제외)

---

## 보안 — pre-commit 훅

`npm install` 시 `.git/hooks/pre-commit`이 설치됩니다. 커밋 직전에 다음을 검사합니다.

- `.env` 등 민감 경로 스테이징 차단
- `.gitignore` 대상 파일의 `git add -f` 차단
- 스테이징된 **추가 줄**에서 API 키·private key·env 비밀값 패턴 감지

차단 시 `git restore --staged <file>`로 스테이징을 해제하세요.

```bash
npm run hooks:install   # 수동 재설치
```

---

## 코드 품질 & 테스트

```bash
npm run lint
npm run format:check
npm test
```

- ESLint: `@react-native/eslint-config`
- Prettier: `.prettierrc.js` (android/ios/node_modules는 ignore)
- Jest: `__tests__/` · `*.test.tsx`
- Maestro E2E: `.maestro/flows/` (셀렉터는 `src/constants/e2e/testIds.ts`)

### E2E (Maestro)

실제 기기·에뮬레이터에서 설정 플로우와 메인 탐색을 QA합니다. **debug 빌드**가 필요합니다. `__DEV__`에서만 보이는 `E2E: 메인으로`로 OAuth 없이 홈에 들어갑니다.

1. [Maestro CLI](https://docs.maestro.dev/getting-started/installing-maestro)를 설치합니다. Windows는 `maestro.zip`을 `%USERPROFILE%\maestro`에 풀면 `npm run e2e`가 PATH 없이 찾습니다.
2. Metro를 띄운 뒤 debug 앱을 설치합니다. `npm start`와 `npm run android`는 터미널을 나눠 실행하세요.
3. 플로우를 실행합니다.

```bash
npm run e2e:smoke   # 언어·온보딩·로그인 UI + 홈/탭
npm run e2e         # .maestro/flows 전체
```

`rel/**` 푸시와 workflow_dispatch에서 GitHub Actions가 `e2e:smoke`를 돌립니다. PR에는 넣지 않습니다.

OAuth 실로그인·결제·카메라 미션은 자동화하지 않습니다. 로그인 화면은 버튼 노출만 검증합니다.

### 에디터 (VS Code / Cursor)

`.vscode/settings.json` — 저장 시 Prettier 포맷 + ESLint fix  
권장 확장: ESLint, Prettier (`.vscode/extensions.json` 참고)

---

## iOS 추가 설정

```bash
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
```

---

## 라이선스

Private — BU-TING 프로젝트 내부용
