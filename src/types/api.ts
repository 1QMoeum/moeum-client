/** 서버 공통 응답 포맷 (ResponseDTO). 모든 응답이 이 모양으로 감쌈 — HTTP 200 + 본문의 success/status. */
export interface ApiResponse<T> {
  success: boolean
  data: T | null
  status: number | null
  message: string | null
}

/** ===== 도메인 타입 — auth ===== */

export interface KycVerifyResponse {
  newUser: boolean
  name: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
}