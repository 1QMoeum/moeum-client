import { apiClient, unwrap } from '@/api/client'
import type {
  BudgetPlanResponse,
  CreateBudgetRequest,
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
  UpdateBudgetRequest,
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

  /** 사용 계획 조회 — 지출 항목(집행일순) + 합계. vendorAccount 는 응답 제외. */
  budgets: (eventId: number) =>
    unwrap<BudgetPlanResponse>(apiClient.get(`/v1/events/${eventId}/budgets`)),

  /**
   * 사용 계획 생성 — 지출 항목들을 PENDING 으로 등록. 진행중 이벤트만(4004), 총대만(4006).
   * 변경 후 전체 사용 계획 반환.
   */
  createBudgets: (userId: number, eventId: number, body: CreateBudgetRequest) =>
    unwrap<BudgetPlanResponse>(
      apiClient.post(`/v1/events/${eventId}/budgets`, body, { params: { userId } }),
    ),

  /**
   * 사용 계획 항목 수정 — 총대만(4006) · PENDING만(4008) · 모금 시작 전만(4009).
   * 변경 후 전체 사용 계획 반환.
   */
  updateBudget: (userId: number, eventId: number, budgetId: number, body: UpdateBudgetRequest) =>
    unwrap<BudgetPlanResponse>(
      apiClient.patch(`/v1/events/${eventId}/budgets/${budgetId}`, body, { params: { userId } }),
    ),

  /**
   * 사용 계획 항목 취소 — CANCELLED 전이(soft delete, 기록 보존). 총대만(4006) · PENDING만(4008).
   * 모금 후에도 취소 가능. 변경 후 전체 사용 계획 반환.
   */
  cancelBudget: (userId: number, eventId: number, budgetId: number) =>
    unwrap<BudgetPlanResponse>(
      apiClient.delete(`/v1/events/${eventId}/budgets/${budgetId}`, { params: { userId } }),
    ),
}
