# 프로젝트: 모음 (moeum-client)

본인인증(KYC)·PIN 기반 인증 플로우를 담당하는 React 웹 클라이언트입니다.
포트원(PortOne) V2 본인인증과 자체 백엔드 인증 API를 연동합니다.

## 기술 스택

- **빌드 도구**: Vite 5.4
- **Framework**: React 19.2 (react-router-dom 7 / SPA)
- **언어**: TypeScript (`noUnusedLocals`·`noUnusedParameters`·`verbatimModuleSyntax` 활성)
- **서버 상태**: TanStack Query 5
- **클라이언트 상태**: Zustand 5 (persist)
- **HTTP**: axios (공통 응답 래퍼 `unwrap` / `ApiError`)
- **폼/검증**: react-hook-form 7 + zod 4
- **본인인증**: @portone/browser-sdk v2 (KG이니시스 통합인증)
- **린트/포맷**: oxlint + prettier
- **패키지 매니저**: npm

## 코드 스타일

- `any` 타입 금지. 타입 안전성을 항상 보장한다.
- import 경로는 path alias `@/*` 사용 (`@/* → src/*`). `../../` 상대경로 금지.
- 타입 전용 import는 `import type` 사용 (`verbatimModuleSyntax` 강제).
- **스타일링**: 현재 코드베이스는 `src/index.css`의 CSS 커스텀 프로퍼티(`var(--color-*)`)
  + 인라인 `style` props 방식을 사용한다. Tailwind는 의존성에만 있고 실사용하지 않으므로
  기존 패턴(인라인 style + CSS 변수)을 따른다.
- 페이지/컴포넌트 export 방식은 기존 파일 컨벤션을 따른다
  (페이지는 `export default`, 다수 유틸/훅은 named export).

## 명령어

- `npm run dev`: 개발 서버 시작 (포트 5173)
- `npm run build`: 타입체크(`tsc -b`) + 프로덕션 빌드(`vite build`)
- `npm run preview`: 빌드 결과물(`dist/`)을 로컬 서빙 (build 선행 필요)
- `npm run lint`: oxlint 실행

## 아키텍처

- `/src/api`: axios 클라이언트, 토큰 인터셉터, API 함수, 공통 응답 처리(`unwrap`/`ApiError`/`toErrorMessage`)
- `/src/hooks`: TanStack Query mutation/query 훅 (서버 통신 + 부수효과 캡슐화)
- `/src/store`: Zustand 전역 상태 (`auth` — 토큰)
- `/src/pages`: 라우트 단위 페이지 컴포넌트
- `/src/components/ui`: 공용 프레젠테이션 컴포넌트 (Button, Screen, ErrorBanner, MoeumLogo)
- `/src/components/auth`: 인증 도메인 컴포넌트 (PinInput, AuthBootstrap)
- `/src/constants`: 도메인 상수 (errorCodes 등)
- `/src/lib`: 외부 SDK 래퍼 (portone)
- `/src/types`: 재사용 타입 (서버 응답 DTO 등)

## 백엔드 API 규약 (중요)

- 서버는 **항상 HTTP 200 + 공통 `ResponseDTO`** 로 응답한다. 성공/실패는 HTTP 상태가 아니라
  본문의 `success` 필드로 판별한다.
- API 호출은 `src/api/`의 함수를 쓰고, 응답은 `unwrap`이 풀어 실패 시 `ApiError`로 통일해 throw한다.
- 도메인 에러는 본문 `status` 코드로 구분한다. 매직넘버 대신 `@/constants/errorCodes`의 상수를 쓴다.
- 새 API는 `src/api/`에 함수 추가 → `src/hooks/`에 mutation/query 훅으로 감싸 페이지에서 소비한다.
  페이지에서 `useState(loading/error)` + `try/catch`를 직접 만들지 않는다.

## 인증 흐름

- `accessToken`은 메모리(Zustand)만, `refreshToken`은 localStorage에 persist한다.
- 새로고침 시 access가 사라지므로 `AuthBootstrap`이 진입 시 refresh로 access를 재발급해 세션을 복원한다.
- 환경변수: `VITE_API_BASE_URL`, `VITE_PORTONE_STORE_ID`, `VITE_PORTONE_CHANNEL_KEY` (`.env.example` 참고).

## 중요 사항

### 절대 하지 말아야 할 것

- `.env` 파일 커밋
- `any` 타입 사용
- 직접적인 DOM 조작
- 프로덕션 코드에 `console.log` 남기기
- 소스 파일을 `src/` 밖에 두기 (모든 소스는 `src/` 내부)

### 권장사항

- 실제 API를 호출하는 코드 작성
- 재사용 가능한 컴포넌트 설계 및 재사용 (공용은 `components/ui`)
- 서버 상태는 TanStack Query, 클라이언트 전역 상태는 Zustand로 분리
- 접근성(a11y) 고려
- 성능 최적화 적용

### 문제 해결 우선순위

1. 실제 동작하는 해결책 찾기
2. 기존 코드 패턴 분석 후 일관성 유지
3. 타입 안전성 보장
