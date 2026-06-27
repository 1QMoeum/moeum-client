/**
 * 서버 ResponseDTO.status 에 실리는 도메인 에러코드.
 * 페이지에서 매직넘버 대신 이 상수로 분기한다. (실제 사용하는 코드만 등록)
 */
export const ErrorCode = {
  /** refresh 토큰 만료/위조 — KYC 부터 다시 시작해야 함 */
  REFRESH_INVALID: 2006,
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]
