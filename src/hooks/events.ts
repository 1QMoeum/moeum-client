import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { eventApi } from '@/api/events'
import { getUserIdFromToken } from '@/lib/jwt'
import { useAuthStore } from '@/store/auth'
import type {
  CreateEventRequest,
  CreateEventResponse,
  EventDetailResponse,
  EventListQuery,
  EventListResponse,
  MapBounds,
  ParticipateResponse,
} from '@/types/event'

/** 줌아웃 — 법정동별 집계. 줌아웃 상태일 때만 호출. */
export function useEventMap(enabled: boolean) {
  return useQuery({
    queryKey: ['events', 'map'],
    enabled,
    staleTime: 60_000,
    queryFn: () => eventApi.map(),
  })
}

/**
 * 이벤트 목록(탐색). status·category 필터로 서버에서 거른다(미지정 시 전체).
 * 최신순 페이징 응답(content + 페이지 메타).
 */
export function useEventList(query: EventListQuery, enabled = true) {
  return useQuery<EventListResponse, ApiError>({
    queryKey: ['events', 'list', query],
    enabled,
    staleTime: 30_000,
    queryFn: () => eventApi.list(query),
  })
}

/** 확대 — viewport bounds 의 개별 이벤트. bounds 가 바뀔 때마다(이동/줌) 재조회. */
export function useEventMapWithin(bounds: MapBounds | null, enabled: boolean) {
  return useQuery({
    queryKey: ['events', 'within', bounds],
    enabled: enabled && bounds !== null,
    staleTime: 30_000,
    queryFn: () => eventApi.within(bounds as MapBounds),
  })
}

/**
 * 이벤트 단건 상세 (참여 화면용). 없으면 ApiError(status 4000).
 * eventId 가 없으면(라우트 진입 전) 비활성화.
 */
export function useEventDetail(eventId: number | null) {
  return useQuery<EventDetailResponse, ApiError>({
    queryKey: ['events', 'detail', eventId],
    enabled: eventId !== null,
    staleTime: 30_000,
    retry: false,
    queryFn: () => eventApi.detail(eventId as number),
  })
}

/**
 * 이벤트(모금) 생성. userId 는 accessToken(JWT sub)에서 파생한다.
 * 기간 4002 · venue없음 5000 · 위치없음 4003 은 페이지에서 status 로 분기.
 * 성공 시 지도 집계 캐시를 무효화한다.
 */
export function useCreateEvent() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  return useMutation<CreateEventResponse, ApiError, CreateEventRequest>({
    mutationFn: (body) => {
      const userId = getUserIdFromToken(accessToken)
      if (userId == null) {
        throw new ApiError(null, '사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.')
      }
      return eventApi.create(userId, body)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

/** 모금 참여 mutation 변수. */
type ParticipateVars = { eventId: number; amount: number }

/**
 * 모금 참여 (결제+입금). userId 는 accessToken(JWT sub)에서 파생한다.
 * 1인1참여 4005 · 진행중아님 4004 · 통장부족 2010 은 페이지에서 status 로 분기.
 * 성공 시 해당 이벤트 상세·지도 캐시를 무효화해 모금률을 갱신한다.
 */
export function useParticipateEvent() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  return useMutation<ParticipateResponse, ApiError, ParticipateVars>({
    mutationFn: ({ eventId, amount }) => {
      const userId = getUserIdFromToken(accessToken)
      if (userId == null) {
        throw new ApiError(null, '사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.')
      }
      return eventApi.participate(userId, eventId, { amount })
    },
    onSuccess: (_res, { eventId }) => {
      void qc.invalidateQueries({ queryKey: ['events', 'detail', eventId] })
      void qc.invalidateQueries({ queryKey: ['events', 'map'] })
      void qc.invalidateQueries({ queryKey: ['events', 'within'] })
    },
  })
}
