import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { calendarApi } from '@/api/calendar'
import { getUserIdFromToken } from '@/lib/jwt'
import { useAuthStore } from '@/store/auth'
import type { CalendarMonthResponse, EventTimelineResponse } from '@/types/calendar'

/**
 * 월 캘린더 조회. userId 는 accessToken(JWT sub)에서 파생 — 로그인 전엔 비활성.
 * yearMonth 는 YYYY-MM.
 */
export function useCalendarMonth(yearMonth: string) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = getUserIdFromToken(accessToken)
  return useQuery<CalendarMonthResponse, ApiError>({
    queryKey: ['calendar', 'month', userId, yearMonth],
    enabled: userId != null,
    staleTime: 30_000,
    queryFn: () => calendarApi.month(userId as number, yearMonth),
  })
}

/**
 * 이벤트 타임라인 (일정 카드 펼침 시 lazy 조회).
 * eventId 가 null 이면(접힘) 호출하지 않는다. date 는 anchor 기준 날짜.
 */
export function useEventTimeline(eventId: number | null, date?: string) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = getUserIdFromToken(accessToken)
  return useQuery<EventTimelineResponse, ApiError>({
    queryKey: ['calendar', 'timeline', userId, eventId, date],
    enabled: userId != null && eventId != null,
    staleTime: 30_000,
    queryFn: () => calendarApi.timeline(userId as number, eventId as number, date),
  })
}
