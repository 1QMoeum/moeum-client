import { apiClient, unwrap } from '@/api/client'
import type {
  KycForeignFaceResponse,
  KycForeignPassportResponse,
  KycVerifyResponse,
  TokenResponse,
} from '@/types/api'

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

  /** Step 1 — 여권 multipart → OCR + MRZ → 이름·국적·만료 + newUser. 한국 여권은 2015 로 거절. */
  verifyForeignPassport: (passport: File) => {
    const form = new FormData()
    form.append('passport', passport)
    return unwrap<KycForeignPassportResponse>(
      apiClient.post('/v1/auth/kyc/foreign/verify-passport', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  },

  /** Step 2 — 여권 + 셀피 multipart → Rekognition CompareFaces → similarity. */
  verifyForeignFace: (passport: File, selfie: File) => {
    const form = new FormData()
    form.append('passport', passport)
    form.append('selfie', selfie)
    return unwrap<KycForeignFaceResponse>(
      apiClient.post('/v1/auth/kyc/foreign/verify-face', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  },

  /** 외국인 회원가입 — 여권 + 셀피 multipart + PIN. */
  signupForeign: (passport: File, selfie: File, pin: string) => {
    const form = new FormData()
    form.append('passport', passport)
    form.append('selfie', selfie)
    form.append('pin', pin)
    return unwrap<TokenResponse>(
      apiClient.post('/v1/auth/signup/foreign', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  },

  /** 외국인 재인증 로그인 — 여권 + 셀피 multipart + PIN. */
  kycLoginForeign: (passport: File, selfie: File, pin: string) => {
    const form = new FormData()
    form.append('passport', passport)
    form.append('selfie', selfie)
    form.append('pin', pin)
    return unwrap<TokenResponse>(
      apiClient.post('/v1/auth/kyc-login/foreign', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  },
}