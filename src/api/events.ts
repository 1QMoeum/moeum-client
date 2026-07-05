import { apiClient, unwrap } from '@/api/client'
import type {
  BudgetPlanResponse,
  CancelEventResponse,
  CreateBudgetRequest,
  CreateEventRequest,
  CreateEventResponse,
  EventDetailResponse,
  EventHistoryResponse,
  EventListQuery,
  EventListResponse,
  EventMapResponse,
  EventMapWithinResponse,
  EventPost,
  EventPostSlice,
  MapBounds,
  OperatingEventsResponse,
  ParticipateRequest,
  ParticipateResponse,
  ParticipatingEventsResponse,
  PostInput,
  SettlementResponse,
  UpdateEventRequest,
} from '@/types/event'

export const eventApi = {
  /** 이벤트 목록(최신순 페이징). status·category 미지정 시 전체. */
  list: (query: EventListQuery = {}) =>
    unwrap<EventListResponse>(apiClient.get('/v1/events', { params: query })),

  /** 참여중인 이벤트 (홈 캐러셀) — 참여 확정(ACTIVE) 이벤트를 마감 임박순으로. 환불·삭제 제외. */
  participating: (userId: number) =>
    unwrap<ParticipatingEventsResponse>(
      apiClient.get('/v1/events/participating', { params: { userId } }),
    ),

  /** 운영중인 이벤트 (내가 총대) — 내가 만든 진행중(ONGOING) 이벤트를 최신순으로. 삭제 제외. */
  operating: (userId: number) =>
    unwrap<OperatingEventsResponse>(apiClient.get('/v1/events/operating', { params: { userId } })),

  /** 지도 이벤트 집계 (줌아웃) — 진행중 이벤트를 법정동별로 집계 */
  map: () => unwrap<EventMapResponse>(apiClient.get('/v1/events/map')),

  /** 지도 영역(viewport) 진행중 이벤트 (확대) — 현재 화면 bounds 의 이벤트 전체 */
  within: (bounds: MapBounds) =>
    unwrap<EventMapWithinResponse>(apiClient.get('/v1/events/map/within', { params: bounds })),

  /** 지도 히스토리 — 종료 이벤트를 법정동별 집계 (최다 아티스트 + 프로젝트/참여자 수) */
  history: () => unwrap<EventHistoryResponse>(apiClient.get('/v1/events/map/history')),

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
   * 이벤트 수정 (총대만) — 소개·기간·진행시간. 응답은 상세 전체.
   * 총대아님 4006 · 진행중아님 4004 · 기간오류 4002 · 없음 4000.
   */
  update: (eventId: number, body: UpdateEventRequest) =>
    unwrap<EventDetailResponse>(apiClient.patch(`/v1/events/${eventId}`, body)),

  /**
   * 이벤트 취소 + 환불 (총대만) — PENDING 사용계획 취소, 미집행 잔액을 참여자에게 비례 환불(내림).
   * 이미 집행된 건은 환불 불가. 총대아님 4006 · 진행중아님 4004.
   */
  cancel: (userId: number, eventId: number) =>
    unwrap<CancelEventResponse>(
      apiClient.post(`/v1/events/${eventId}/cancel`, null, { params: { userId } }),
    ),

  /** 정산 거래내역 (참여자/총대만) — 입금·출금 내역 + 합계. 미참여 4001 · 없음 4000. */
  settlement: (eventId: number) =>
    unwrap<SettlementResponse>(apiClient.get(`/v1/events/${eventId}/settlement`)),

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
   * 사용 계획 항목 취소 — CANCELLED 전이(soft delete, 기록 보존). 총대만(4006) · PENDING만(4008).
   * 모금 후에도 취소 가능. 변경 후 전체 사용 계획 반환.
   */
  cancelBudget: (userId: number, eventId: number, budgetId: number) =>
    unwrap<BudgetPlanResponse>(
      apiClient.delete(`/v1/events/${eventId}/budgets/${budgetId}`, { params: { userId } }),
    ),

  /** 공지 목록 — 최신순 Slice 페이징. */
  posts: (eventId: number, page = 0, size = 20) =>
    unwrap<EventPostSlice>(
      apiClient.get(`/v1/events/${eventId}/posts`, { params: { page, size } }),
    ),

  /** 공지 작성 — 총대만. fileIds 로 다중 이미지 첨부. 참여자에게 알림 발송. */
  createPost: (userId: number, eventId: number, body: PostInput) =>
    unwrap<EventPost>(apiClient.post(`/v1/events/${eventId}/posts`, body, { params: { userId } })),

  /** 공지 수정 — 총대(작성자)만. fileIds 로 이미지 목록 완전 교체. */
  updatePost: (userId: number, eventId: number, postId: number, body: PostInput) =>
    unwrap<EventPost>(
      apiClient.patch(`/v1/events/${eventId}/posts/${postId}`, body, { params: { userId } }),
    ),

  /** 공지 삭제 — 총대(작성자)만. Soft delete. */
  deletePost: (userId: number, eventId: number, postId: number) =>
    unwrap<string>(apiClient.delete(`/v1/events/${eventId}/posts/${postId}`, { params: { userId } })),
}
