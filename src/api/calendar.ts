import { apiClient, unwrap } from '@/api/client'
import type { CalendarMonthResponse, EventTimelineResponse } from '@/types/calendar'

export const calendarApi = {
  /** 월 캘린더 — 참여 중인 이벤트의 해당 월 사용계획(지출) + 시작/마감일. */
  month: (userId: number, yearMonth: string) =>
    unwrap<CalendarMonthResponse>(apiClient.get('/v1/calendar', { params: { userId, yearMonth } })),

  /**
   * 이벤트 사용계획 타임라인 (카드 펼침) — 시작/마감일 + 전체 사용계획 날짜순.
   * date 를 주면 그 날짜 노드가 anchor 로 표시된다. 참여 중이 아니면 접근 불가.
   */
  timeline: (userId: number, eventId: number, date?: string) =>
    unwrap<EventTimelineResponse>(
      apiClient.get(`/v1/calendar/events/${eventId}/timeline`, { params: { userId, date } }),
    ),
}
