/** 캘린더 API 타입.
 *  (GET /v1/calendar, GET /v1/calendar/events/{eventId}/timeline) */

import type { BudgetStatus } from '@/types/event'

/** 항목 종류 — 사용계획 지출 또는 이벤트 시작/마감일 마일스톤. */
export type CalendarEntryType = 'BUDGET' | 'EVENT_START' | 'EVENT_END'

/** 월 캘린더 항목 한 줄. 같은 날짜에 여러 이벤트면 항목이 여러 개(점으로 렌더). */
export interface CalendarEntryDto {
  /** YYYY-MM-DD */
  date: string
  eventId: number
  eventTitle: string
  type: CalendarEntryType
  /** BUDGET 일 때만 존재 */
  budgetId: number | null
  title: string
  amount: number | null
  executionStatus: BudgetStatus | null
  /** 모금(입금) 완료 여부 — false 면 '입금 미완료' 칩 */
  fundingComplete: boolean
}

export interface CalendarMonthResponse {
  /** YYYY-MM */
  yearMonth: string
  entries: CalendarEntryDto[]
}

/** 타임라인 노드 — date 기준 anchor 가 현재(강조) 표시 대상. */
export interface TimelineNodeDto {
  date: string
  type: CalendarEntryType
  budgetId: number | null
  title: string
  amount: number | null
  status: BudgetStatus | null
  anchor: boolean
}

export interface EventTimelineResponse {
  eventId: number
  eventTitle: string
  anchorDate: string
  nodes: TimelineNodeDto[]
}
