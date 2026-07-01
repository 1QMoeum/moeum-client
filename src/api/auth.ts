import { apiClient, unwrap } from '@/api/client'
import type { KycForeignVerifyResponse, KycVerifyResponse, TokenResponse } from '@/types/api'

export const authApi = {
  verifyKyc: (identityVerificationId: string) =>
    unwrap<KycVerifyResponse>(
      apiClient.post('/v1/auth/kyc/domestic/verify', { identityVerificationId }),
    ),

  signup: (identityVerificationId: string, pin: string) =>
    unwrap<TokenResponse>(apiClient.post('/v1/auth/signup', { identityVerificationId, pin })),

  /** 간편 로그인 — refresh + PIN. KYC 없이 평상시 경로. */
  login: (refreshToken: string, pin: string) =>
    unwrap<TokenResponse>(apiClient.post('/v1/auth/login', { refreshToken, pin })),

  /** 재인증 로그인 — KYC + PIN. refresh 잃었을 때. */
  kycLogin: (identityVerificationId: string, pin: string) =>
    unwrap<TokenResponse>(apiClient.post('/v1/auth/kyc-login', { identityVerificationId, pin })),

  refresh: (refreshToken: string) =>
    unwrap<TokenResponse>(apiClient.post('/v1/auth/refresh', { refreshToken })),

  logout: (refreshToken: string) =>
    unwrap<null>(apiClient.post('/v1/auth/logout', { refreshToken })),

  // ── 외국인 KYC (자체 OCR + MRZ. multipart) ──────────────────────────

  /** 외국인 KYC verify — 여권 multipart 업로드 → OCR + MRZ → 정보 추출 + newUser 판별. */
  verifyForeignKyc: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return unwrap<KycForeignVerifyResponse>(
      apiClient.post('/v1/auth/kyc/foreign/verify', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  },

  /** 외국인 회원가입 — 여권 multipart + PIN. */
  signupForeign: (file: File, pin: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('pin', pin)
    return unwrap<TokenResponse>(
      apiClient.post('/v1/auth/signup/foreign', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  },

  /** 외국인 재인증 로그인 — 여권 multipart + PIN. */
  kycLoginForeign: (file: File, pin: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('pin', pin)
    return unwrap<TokenResponse>(
      apiClient.post('/v1/auth/kyc-login/foreign', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  },
}