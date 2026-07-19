/** ===== 도메인 타입 — notification (인앱 알림함) ===== */

/** 서버 알림 종류 (7종) — 제목은 서버가 type 별로 내려준다. */
export type NotificationType =
  | 'CHARGE_SUCCESS'
  | 'WITHDRAW_SUCCESS'
  | 'PARTICIPATION'
  | 'BUDGET_DUE'
  | 'EXECUTION'
  | 'REFUND'
  | 'POST_CREATED'

/** 알림 목록/개별 항목 (GET /v1/notifications) */
export interface NotificationSummary {
  notificationId: number
  type: NotificationType
  title: string
  message: string
  /** 관련 이벤트 — 없는 알림(충전/전환 등)은 null */
  eventId: number | null
  isRead: boolean
  /** LocalDateTime (예: 2026-07-19T12:34:56) */
  createdAt: string
}

/** 알림 목록 페이징 응답 — 총 개수 대신 hasNext 로 무한스크롤 판정 */
export interface NotificationListResponse {
  content: NotificationSummary[]
  hasNext: boolean
}

/** 미읽음 알림 수 (GET /v1/notifications/unread-count) — 뱃지용 */
export interface UnreadCountResponse {
  count: number
}
