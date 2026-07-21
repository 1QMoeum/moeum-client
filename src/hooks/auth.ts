import { useMutation } from '@tanstack/react-query'
import type { ApiError } from '@/api/client'
import { authApi } from '@/api/auth'
import { requestKgInicisIdentityVerification } from '@/lib/portone'
import { useAuthStore } from '@/store/auth'
import type {
  KycForeignFaceResponse,
  KycForeignPassportResponse,
  KycVerifyResponse,
  TokenResponse,
} from '@/types/api'

/**
 * auth 도메인의 서버 통신을 React Query mutation 으로 감싼 훅 레이어.
 * 페이지는 loading/error 상태와 토큰 저장 같은 부수효과를 직접 다루지 않고
 * 여기서 반환하는 isPending/error/mutate 만 소비한다.
 */

interface KycPinVars {
  identityVerificationId: string
  pin: string
}

/** 포트원 본인인증 → 서버 KYC 검증까지 한 흐름. newUser 판별값과 id 를 함께 반환. */
export function useVerifyKyc() {
  return useMutation<{ identityVerificationId: string; result: KycVerifyResponse }, Error, void>({
    mutationFn: async () => {
      const identityVerificationId = await requestKgInicisIdentityVerification()
      const result = await authApi.verifyKyc(identityVerificationId)
      return { identityVerificationId, result }
    },
  })
}

const DEMO_KYC_KEY = 'moeum:demo-kyc-key'

/**
 * [시연용] 인증 없이 바로 체험 — 포트원 SDK 를 건너뛰고 `demo:{키}` 형식 ID 로 서버 KYC 검증을 받는다
 * (서버의 데모 우회 어댑터가 가상 인증으로 통과 처리, docs/note/10_DEMO_AUTH_BYPASS.md).
 * 키는 localStorage 에 보관해 재방문 시 같은 체험 계정으로 이어진다(newUser=false → 재인증 로그인).
 */
export function useVerifyDemoKyc() {
  return useMutation<{ identityVerificationId: string; result: KycVerifyResponse }, Error, void>({
    mutationFn: async () => {
      let key = localStorage.getItem(DEMO_KYC_KEY)
      if (!key) {
        key = crypto.randomUUID()
        localStorage.setItem(DEMO_KYC_KEY, key)
      }
      const identityVerificationId = `demo:${key}`
      const result = await authApi.verifyKyc(identityVerificationId)
      return { identityVerificationId, result }
    },
  })
}

/** 간편 로그인 — refresh + PIN. 성공 시 토큰 저장. */
export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens)
  return useMutation<TokenResponse, ApiError, { refreshToken: string; pin: string }>({
    mutationFn: ({ refreshToken, pin }) => authApi.login(refreshToken, pin),
    onSuccess: ({ accessToken, refreshToken }) => setTokens(accessToken, refreshToken),
  })
}

/** 회원가입 — KYC + PIN. 성공 시 토큰 저장 + userType=DOMESTIC 저장. */
export function useSignup() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUserType = useAuthStore((s) => s.setUserType)
  return useMutation<TokenResponse, ApiError, KycPinVars>({
    mutationFn: ({ identityVerificationId, pin }) => authApi.signup(identityVerificationId, pin),
    onSuccess: ({ accessToken, refreshToken }) => {
      setTokens(accessToken, refreshToken)
      setUserType('DOMESTIC')
    },
  })
}

/** 재인증 로그인 — KYC + PIN. 성공 시 토큰 저장 + userType=DOMESTIC 저장. */
export function useKycLogin() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUserType = useAuthStore((s) => s.setUserType)
  return useMutation<TokenResponse, ApiError, KycPinVars>({
    mutationFn: ({ identityVerificationId, pin }) => authApi.kycLogin(identityVerificationId, pin),
    onSuccess: ({ accessToken, refreshToken }) => {
      setTokens(accessToken, refreshToken)
      setUserType('DOMESTIC')
    },
  })
}

/** 로그아웃 — 멱등. 서버 호출 성공/실패와 무관하게 로컬 토큰은 클리어. */
export function useLogout() {
  const clearTokens = useAuthStore((s) => s.clearTokens)
  return useMutation<null, ApiError, string>({
    mutationFn: (refreshToken) => authApi.logout(refreshToken),
    onSettled: () => clearTokens(),
  })
}

// ── 외국인 KYC mutation 훅 (2단계 분리) ────────────────────────────

interface ForeignFaceVars {
  passport: File
  selfie: File
}

interface ForeignKycPinVars extends ForeignFaceVars {
  pin: string
}

/** Step 1 — passport → OCR + MRZ. 한국 여권은 2015 로 거절. */
export function useVerifyForeignPassport() {
  return useMutation<KycForeignPassportResponse, ApiError, File>({
    mutationFn: (passport) => authApi.verifyForeignPassport(passport),
  })
}

/** Step 2 — passport + selfie → face similarity. */
export function useVerifyForeignFace() {
  return useMutation<KycForeignFaceResponse, ApiError, ForeignFaceVars>({
    mutationFn: ({ passport, selfie }) => authApi.verifyForeignFace(passport, selfie),
  })
}

/** Foreign signup — passport + selfie + PIN. Saves tokens + userType=FOREIGN on success. */
export function useSignupForeign() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUserType = useAuthStore((s) => s.setUserType)
  return useMutation<TokenResponse, ApiError, ForeignKycPinVars>({
    mutationFn: ({ passport, selfie, pin }) => authApi.signupForeign(passport, selfie, pin),
    onSuccess: ({ accessToken, refreshToken }) => {
      setTokens(accessToken, refreshToken)
      setUserType('FOREIGN')
    },
  })
}

/** Foreign re-verification login — passport + selfie + PIN. Saves tokens + userType=FOREIGN on success. */
export function useKycLoginForeign() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUserType = useAuthStore((s) => s.setUserType)
  return useMutation<TokenResponse, ApiError, ForeignKycPinVars>({
    mutationFn: ({ passport, selfie, pin }) => authApi.kycLoginForeign(passport, selfie, pin),
    onSuccess: ({ accessToken, refreshToken }) => {
      setTokens(accessToken, refreshToken)
      setUserType('FOREIGN')
    },
  })
}