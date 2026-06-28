/**
 * 메인 화면(참여중인 이벤트 캐러셀) 목 데이터.
 * 백엔드 연동 전까지 화면 동작 확인용. API 나오면 hooks/query 로 교체.
 */

export interface ParticipatingEvent {
  eventId: number
  title: string
  /** 마감까지 남은 일수 (D-n) */
  daysLeft: number
  targetAmount: number
  currentAmount: number
  /** 참여자 수 */
  participantCount: number
  /** 진행일 (YY.MM.DD) */
  startedAt: string
  /** 대표 이미지 (없으면 그라데이션 플레이스홀더) */
  imageUrl?: string
}

export const MOCK_PARTICIPATING_EVENTS: ParticipatingEvent[] = [
  {
    eventId: 1,
    title: '리나 생일 광고 이벤트',
    daysLeft: 12,
    targetAmount: 1_500_000,
    currentAmount: 1_390_000,
    participantCount: 220,
    startedAt: '26.06.24',
  },
  {
    eventId: 2,
    title: '하루 데뷔 1주년 카페',
    daysLeft: 5,
    targetAmount: 3_000_000,
    currentAmount: 1_620_000,
    participantCount: 318,
    startedAt: '26.06.18',
  },
  {
    eventId: 3,
    title: '서아 팬미팅 서포트',
    daysLeft: 21,
    targetAmount: 5_000_000,
    currentAmount: 2_050_000,
    participantCount: 564,
    startedAt: '26.06.10',
  },
]
