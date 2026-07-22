<div align="center">

# moeum-client

### 팬 모금 에스크로 서비스 **모음(Moeum)** 프론트엔드

국내·글로벌 팬이 모금에 참여하고 자금 흐름을 실시간으로 검증하는 **모바일 우선 PWA** (5개 언어)

<br/>

[**서비스**](https://www.moeum.site) &nbsp;·&nbsp; [**백엔드 (moeum-server)**](https://github.com/1QMoeum/moeum-server) &nbsp;·&nbsp; [**컨트랙트 (moeum-contracts)**](https://github.com/1QMoeum/moeum-contracts)

</div>

---

## 소개

**moeum-client**는 모음 서비스의 웹 클라이언트입니다. 하나은행 앱에서 진입하는 시나리오(스플래시 → 자산 화면 → 모음 진입)부터 본인인증, 모금 참여, 지도 탐색, 지갑 관리까지 서비스의 전 사용자 여정을 담당합니다.

- **모바일 우선 PWA** — 홈 화면 설치(`beforeinstallprompt` + iOS standalone 감지), 서비스 워커 기반 FCM 백그라운드 푸시
- **글로벌 팬 지원** — 한국어·영어·일본어·중국어·베트남어 5개 언어(i18next), 외국인 여권 e-KYC 플로우 내장
- **결제·인증 SDK 직접 연동** — 포트원 V2 Browser SDK(KG이니시스 통합인증), 카카오맵 JS SDK

---

## 주요 기능

### 온보딩 & 인증

- 하나은행 앱 진입 시나리오 (스플래시 → 자산 → 모음 엔트리) + 서비스 온보딩
- 국내: 포트원 V2 본인인증(KG이니시스) → PIN 등록 → **PIN 간편 로그인**
- 외국인: **여권 촬영 → OCR 결과 확인 → 셀피 얼굴 매칭** 3단계 e-KYC 가입/로그인 (전용 페이지 분리)
- `accessToken`은 메모리(Zustand)에만, `refreshToken`은 localStorage에 보관 — 새로고침 시 `AuthBootstrap`이 refresh로 세션 자동 복원

### 모금 (이벤트)

- 이벤트 목록·상세·생성(사용계획 등록)·수정, 참여(부족분 자동 충전 안내 포함)
- **AI 플래너** — 자연어로 조건을 입력하면 장소 Top 5를 추천 이유와 함께 제시, 이벤트 생성으로 연결
- 정산 내역·참여자 수·D-day·달성률 등 카드/상세 UI, 관심 이벤트 북마크

### 지도 & 캘린더

- **카카오맵 기반 동네 탐색** — 지도 영역 내 이벤트 핀(대표 이미지)과 아티스트 히스토리 조회
- **법정동 경계 오버레이** — 행안부 법정동 SHP를 mapshaper로 시군구별 GeoJSON으로 빌드하는 자체 파이프라인(`npm run geo:build`), 서버 `legalDongCode`와 10자리 코드 매칭
- 지출 예정일 캘린더 (react-day-picker)

### 지갑 & 계좌

- 예금토큰 지갑 잔액·충전·출금, 거래 내역(원장) 조회
- 계좌 연동 플로우 — 국내 마이데이터 동의·계좌 선택 / 외국인 Plaid 동의·계좌 선택
- 마이페이지 — 내 정보·지갑·연동 계좌·참여/운영/관심 이벤트 요약

### 알림

- Firebase Cloud Messaging — 포그라운드 + 서비스 워커(`firebase-messaging-sw.js`) 백그라운드 푸시, 자금 이동 순간마다 알림

---

## 기술 스택

**Core**

![React 19](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router%207-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)

**State & Form**

![TanStack Query](https://img.shields.io/badge/TanStack%20Query%205-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-433E38?style=for-the-badge&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

**Platform & SDK**

![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Firebase FCM](https://img.shields.io/badge/FCM-DD2C00?style=for-the-badge&logo=firebase&logoColor=white)
![i18next](https://img.shields.io/badge/i18next-26A69A?style=for-the-badge&logo=i18next&logoColor=white)
![Kakao Map](https://img.shields.io/badge/Kakao%20Map-FFCD00?style=for-the-badge&logo=kakao&logoColor=black)
![PortOne](https://img.shields.io/badge/PortOne%20V2-FF6600?style=for-the-badge&logoColor=white)

**Quality & Deploy**

![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![oxlint](https://img.shields.io/badge/oxlint-3A3A3A?style=for-the-badge&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 아키텍처

SPA(react-router-dom 7) + 계층화된 데이터 흐름. **페이지는 훅을 소비할 뿐, 직접 fetch하지 않습니다.**

```
src
├── api          # axios 클라이언트 · 토큰 인터셉터 · API 함수 · 공통 응답 처리(unwrap/ApiError)
├── hooks        # TanStack Query query/mutation 훅 (서버 통신 + 부수효과 캡슐화)
├── store        # Zustand 전역 상태 (auth — 토큰)
├── pages        # 라우트 단위 페이지 (약 30개 — 온보딩·KYC·이벤트·지도·지갑·마이페이지)
├── components   # ui(공용 프레젠테이션) · auth(PinInput, AuthBootstrap 등 도메인)
├── lib          # 외부 SDK 래퍼 (포트원, 카카오맵 로더)
├── i18n         # i18next 설정 + locales/{ko,en,ja,zh,vi}.json
├── constants    # 도메인 상수 (서버 에러 코드 등)
└── types        # 서버 응답 DTO 등 재사용 타입
```

### 데이터 흐름 규칙

```
페이지 → hooks (TanStack Query) → api 함수 → axios → 백엔드
                                     └─ unwrap: ResponseDTO 해체, 실패 시 ApiError throw
```

- 백엔드는 **항상 HTTP 200 + 공통 `ResponseDTO`** 로 응답 — 성공/실패는 본문 `success` 필드로 판별하고, 도메인 에러는 `status` 코드를 `constants/errorCodes` 상수로 분기합니다.
- 서버 상태는 TanStack Query, 클라이언트 전역 상태는 Zustand로 분리합니다. 페이지에서 `useState(loading/error)` + `try/catch`를 직접 만들지 않습니다.
- `any` 금지 · path alias `@/*` 강제 · `import type` 강제(`verbatimModuleSyntax`) 등 타입 안전 규칙은 [CLAUDE.md](CLAUDE.md) 참고.

### 인증 흐름

```
본인인증(포트원/e-KYC) → PIN 등록 → 로그인
   accessToken  : 메모리(Zustand)      — XSS 대비 localStorage 미보관
   refreshToken : localStorage persist — 새로고침 시 AuthBootstrap이 access 재발급
```

---

## Getting Started

### 사전 요구사항

| 항목 | 비고 |
| --- | --- |
| Node.js | 18 이상 (Vite 5) |
| 백엔드 | 로컬 [moeum-server](https://github.com/1QMoeum/moeum-server) 또는 운영 API |
| `.env` | `.env.example` 참고 — API URL, 포트원 키, 카카오맵 JS 키 |

```bash
# .env.example 의 환경 변수
VITE_API_BASE_URL=http://localhost:8080/api   # 백엔드 (context-path /api 포함)
VITE_PORTONE_STORE_ID=...                     # 포트원 V2 콘솔 발급
VITE_PORTONE_CHANNEL_KEY=...
VITE_KAKAO_MAP_KEY=...                        # 카카오 개발자 콘솔 JavaScript 키
```

### 실행

```bash
# 저장소 클론 & 의존성 설치
git clone git@github.com:1QMoeum/moeum-client.git
cd moeum-client
npm install

# 개발 서버 (5173 고정 — 백엔드 CORS 화이트리스트와 일치, 점유 시 즉시 실패)
npm run dev

# 타입체크 + 프로덕션 빌드 / 빌드 결과 로컬 서빙
npm run build
npm run preview

# 테스트 / 린트
npm test
npm run lint
```

- 배포는 Vercel — SPA 라우팅은 `vercel.json` rewrite로 처리합니다.
- 지도 경계 데이터를 다시 만들 때만 `npm run geo:build` 실행 (행안부 법정동 SHP → `public/geo/legaldong/*.json`).

---

## Team

| 이름 | 역할 | GitHub |
| --- | --- | --- |
| 김민재 | Backend · Frontend | [@Dlawoct](https://github.com/Dlawoct) |
| 윤성욱 | Backend · Frontend | [@wngktjd13](https://github.com/wngktjd13) |

---

<div align="center">

**Moeum** — 팬들의 마음이 모이는 곳에, 믿을 수 있는 금융 인프라를.

</div>