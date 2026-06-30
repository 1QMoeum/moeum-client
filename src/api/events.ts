import { apiClient, unwrap } from '@/api/client'
import type {
  CreateEventRequest,
  CreateEventResponse,
  EventDetailResponse,
  EventListQuery,
  EventListResponse,
  EventMapResponse,
  EventMapWithinResponse,
  MapBounds,
  ParticipateRequest,
  ParticipateResponse,
} from '@/types/event'

export const eventApi = {
  /** 이벤트 목록(최신순 페이징). status·category 미지정 시 전체. */
  list: (query: EventListQuery = {}) =>
    unwrap<EventListResponse>(apiClient.get('/v1/events', { params: query })),

  /** 지도 이벤트 집계 (줌아웃) — 진행중 이벤트를 법정동별로 집계 */
  map: () => unwrap<EventMapResponse>(apiClient.get('/v1/events/map')),

  /** 지도 영역(viewport) 진행중 이벤트 (확대) — 현재 화면 bounds 의 이벤트 전체 */
  within: (bounds: MapBounds) =>
    unwrap<EventMapWithinResponse>(apiClient.get('/v1/events/map/within', { params: bounds })),

  /**
   * 이벤트(모금) 생성 — 생성자=총대. 위치는 selectedVenueId(AI) 또는 lat/lng+행정구역(MANUAL).
   * 기간 4002 · venue없음 5000 · 위치없음 4003.
   */
  create: (userId: number, body: CreateEventRequest) =>
    unwrap<CreateEventResponse>(apiClient.post('/v1/events', body, { params: { userId } })),

  /** 이벤트 단건 상세 (참여 화면용). 없으면 4000. */
  detail: (eventId: number) =>
    unwrap<EventDetailResponse>(apiClient.get(`/v1/events/${eventId}`)),

  /**
   * 모금 참여 (결제+입금) — amount(원) 참여. 토큰 부족 시 통장 자동충전→지갑→에스크로 입금.
   * 1인1참여 4005 · 진행중아님 4004 · 통장부족 2010.
   */
  participate: (userId: number, eventId: number, body: ParticipateRequest) =>
    unwrap<ParticipateResponse>(
      apiClient.post(`/v1/events/${eventId}/participate`, body, { params: { userId } }),
    ),
}
