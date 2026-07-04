import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { eventApi } from '@/api/events'
import { getUserIdFromToken } from '@/lib/jwt'
import { useAuthStore } from '@/store/auth'
import type {
  BudgetPlanResponse,
  CreateBudgetRequest,
  CreateEventRequest,
  CreateEventResponse,
  EventDetailResponse,
  EventListQuery,
  EventListResponse,
  EventPost,
  EventPostSlice,
  MapBounds,
  ParticipateResponse,
  ParticipatingEventsResponse,
  PostInput,
  SettlementResponse,
  UpdateBudgetRequest,
  UpdateEventRequest,
} from '@/types/event'

/**
 * 홈 — 내가 참여 확정(ACTIVE)한 이벤트 (마감 임박순).
 * userId 는 accessToken(JWT sub)에서 파생하므로 로그인 전에는 비활성화된다.
 */
export function useParticipatingEvents(enabled = true) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = getUserIdFromToken(accessToken)
  return useQuery<ParticipatingEventsResponse, ApiError>({
    queryKey: ['events', 'participating', userId],
    enabled: enabled && userId != null,
    staleTime: 30_000,
    queryFn: () => eventApi.participating(userId as number),
  })
}

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

/** 히스토리 — 종료 이벤트 법정동별 집계(최다 아티스트). 히스토리 모드일 때만 호출. */
export function useEventHistory(enabled: boolean) {
  return useQuery({
    queryKey: ['events', 'history'],
    enabled,
    staleTime: 60_000,
    queryFn: () => eventApi.history(),
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
 * 이벤트 수정 (총대). 소개·기간·진행시간 갱신 후 상세 캐시를 교체하고 목록/지도를 무효화한다.
 * 총대아님 4006 · 진행중아님 4004 · 기간오류 4002 는 페이지에서 status 로 분기.
 */
export function useUpdateEvent(eventId: number) {
  const qc = useQueryClient()
  return useMutation<EventDetailResponse, ApiError, UpdateEventRequest>({
    mutationFn: (body) => eventApi.update(eventId, body),
    onSuccess: (event) => {
      qc.setQueryData(['events', 'detail', eventId], event)
      void qc.invalidateQueries({ queryKey: ['events', 'list'] })
      void qc.invalidateQueries({ queryKey: ['events', 'map'] })
    },
  })
}

/** 정산 거래내역 (참여자/총대). 미참여(4001)는 페이지에서 빈 상태로 분기. */
export function useEventSettlement(eventId: number | null) {
  return useQuery<SettlementResponse, ApiError>({
    queryKey: ['events', 'settlement', eventId],
    enabled: eventId !== null,
    staleTime: 30_000,
    retry: false,
    queryFn: () => eventApi.settlement(eventId as number),
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

/** 사용 계획 쿼리 키. 생성/수정/취소 mutation 의 setQueryData 대상. */
const budgetsKey = (eventId: number) => ['events', 'budgets', eventId] as const

/**
 * 사용 계획 조회 (지출 항목 + 합계). eventId 가 없으면 비활성화.
 * 사용 계획이 없는 이벤트면 items 빈 배열로 내려온다.
 */
export function useEventBudgets(eventId: number | null) {
  return useQuery<BudgetPlanResponse, ApiError>({
    queryKey: budgetsKey(eventId ?? -1),
    enabled: eventId !== null,
    staleTime: 30_000,
    queryFn: () => eventApi.budgets(eventId as number),
  })
}

/** userId(JWT sub) 파생 — 없으면 ApiError 로 통일. */
function requireUserId(accessToken: string | null): number {
  const userId = getUserIdFromToken(accessToken)
  if (userId == null) {
    throw new ApiError(null, '사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.')
  }
  return userId
}

/**
 * 사용 계획 생성 (총대). 진행중아님 4004 · 총대아님 4006 은 페이지에서 status 로 분기.
 * 성공 시 반환된 전체 계획으로 캐시를 갱신한다.
 */
export function useCreateBudgets(eventId: number) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  return useMutation<BudgetPlanResponse, ApiError, CreateBudgetRequest>({
    mutationFn: (body) => eventApi.createBudgets(requireUserId(accessToken), eventId, body),
    onSuccess: (plan) => qc.setQueryData(budgetsKey(eventId), plan),
  })
}

/** 사용 계획 항목 수정 mutation 변수. */
type UpdateBudgetVars = { budgetId: number; body: UpdateBudgetRequest }

/**
 * 사용 계획 항목 수정 (총대). 총대아님 4006 · PENDING아님 4008 · 모금후잠금 4009.
 * 성공 시 반환된 전체 계획으로 캐시를 갱신한다.
 */
export function useUpdateBudget(eventId: number) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  return useMutation<BudgetPlanResponse, ApiError, UpdateBudgetVars>({
    mutationFn: ({ budgetId, body }) =>
      eventApi.updateBudget(requireUserId(accessToken), eventId, budgetId, body),
    onSuccess: (plan) => qc.setQueryData(budgetsKey(eventId), plan),
  })
}

/**
 * 사용 계획 항목 취소 (총대). CANCELLED soft delete. 총대아님 4006 · PENDING아님 4008.
 * 성공 시 반환된 전체 계획으로 캐시를 갱신한다.
 */
export function useCancelBudget(eventId: number) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  return useMutation<BudgetPlanResponse, ApiError, number>({
    mutationFn: (budgetId) => eventApi.cancelBudget(requireUserId(accessToken), eventId, budgetId),
    onSuccess: (plan) => qc.setQueryData(budgetsKey(eventId), plan),
  })
}

/* ===== 이벤트 공지 (EventPost) ===== */

/** 공지 쿼리 키. 작성/수정/삭제 후 무효화 대상. */
const postsKey = (eventId: number) => ['events', 'posts', eventId] as const

/** 공지 목록 조회 (최신순). 첫 페이지만 노출(간단 목록). */
export function useEventPosts(eventId: number | null) {
  return useQuery<EventPostSlice, ApiError>({
    queryKey: postsKey(eventId ?? -1),
    enabled: eventId !== null,
    staleTime: 30_000,
    queryFn: () => eventApi.posts(eventId as number),
  })
}

/** 공지 작성 (총대). 성공 시 공지 목록을 무효화한다. */
export function useCreatePost(eventId: number) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  return useMutation<EventPost, ApiError, PostInput>({
    mutationFn: (body) => eventApi.createPost(requireUserId(accessToken), eventId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: postsKey(eventId) }),
  })
}

/** 공지 수정 mutation 변수. */
type UpdatePostVars = { postId: number; body: PostInput }

/** 공지 수정 (총대·작성자). 성공 시 공지 목록을 무효화한다. */
export function useUpdatePost(eventId: number) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  return useMutation<EventPost, ApiError, UpdatePostVars>({
    mutationFn: ({ postId, body }) =>
      eventApi.updatePost(requireUserId(accessToken), eventId, postId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: postsKey(eventId) }),
  })
}

/** 공지 삭제 (총대·작성자, soft delete). 성공 시 공지 목록을 무효화한다. */
export function useDeletePost(eventId: number) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  return useMutation<string, ApiError, number>({
    mutationFn: (postId) => eventApi.deletePost(requireUserId(accessToken), eventId, postId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: postsKey(eventId) }),
  })
}
