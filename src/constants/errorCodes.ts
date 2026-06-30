/**
 * 서버 ResponseDTO.status 에 실리는 도메인 에러코드.
 * 페이지에서 매직넘버 대신 이 상수로 분기한다. (실제 사용하는 코드만 등록)
 */
export const ErrorCode = {
  /** refresh 토큰 만료/위조 — KYC 부터 다시 시작해야 함 */
  REFRESH_INVALID: 2006,
  /** 모금 참여 시 통장(연동 계좌) 잔액 부족 — 자동충전 불가 */
  ACCOUNT_INSUFFICIENT: 2010,
  /** 커스터디 지갑 미생성 — 빈 상태(생성 안내) 노출 */
  WALLET_NOT_FOUND: 3000,
  /** 전환(withdraw) 시 예금토큰 잔액 부족 */
  INSUFFICIENT_BALANCE: 3014,
  /** 이벤트 단건 조회 — 대상 이벤트 없음 */
  EVENT_NOT_FOUND: 4000,
  /** 이벤트 생성 — 기간(시작/종료) 값이 유효하지 않음 */
  EVENT_INVALID_PERIOD: 4002,
  /** 이벤트 생성 — 직접입력(MANUAL) 경로에서 위치 정보 누락 */
  EVENT_LOCATION_REQUIRED: 4003,
  /** 모금 참여 — 진행중(ACTIVE) 상태가 아닌 이벤트 */
  EVENT_NOT_ACTIVE: 4004,
  /** 모금 참여 — 이미 참여함(1인 1참여) */
  EVENT_ALREADY_PARTICIPATED: 4005,
  /** 사용 계획 — 총대(생성자)만 등록·수정·취소 가능 */
  BUDGET_NOT_OWNER: 4006,
  /** 사용 계획 — PENDING 항목만 수정·취소 가능 */
  BUDGET_NOT_PENDING: 4008,
  /** 사용 계획 — 모금 시작 후엔 금액·업체 변경 잠금(수정 불가) */
  BUDGET_LOCKED_AFTER_FUNDING: 4009,
  /** 이벤트 생성 — selectedVenueId 에 해당하는 venue 없음 */
  VENUE_NOT_FOUND: 5000,
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]
