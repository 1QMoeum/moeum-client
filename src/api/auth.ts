import { apiClient, unwrap } from '@/api/client'
import type { KycVerifyResponse, TokenResponse } from '@/types/api'

export const authApi = {
  verifyKyc: (identityVerificationId: string) =>
    unwrap<KycVerifyResponse>(
      apiClient.post('/auth/kyc/domestic/verify', { identityVerificationId }),
    ),

  signup: (identityVerificationId: string, pin: string) =>
    unwrap<TokenResponse>(apiClient.post('/auth/signup', { identityVerificationId, pin })),

  /** 간편 로그인 — refresh + PIN. KYC 없이 평상시 경로. */
  login: (refreshToken: string, pin: string) =>
    unwrap<TokenResponse>(apiClient.post('/auth/login', { refreshToken, pin })),

  /** 재인증 로그인 — KYC + PIN. refresh 잃었을 때. */
  kycLogin: (identityVerificationId: string, pin: string) =>
    unwrap<TokenResponse>(apiClient.post('/auth/kyc-login', { identityVerificationId, pin })),

  refresh: (refreshToken: string) =>
    unwrap<TokenResponse>(apiClient.post('/auth/refresh', { refreshToken })),

  logout: (refreshToken: string) =>
    unwrap<null>(apiClient.post('/auth/logout', { refreshToken })),
}