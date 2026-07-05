import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { bookmarkApi } from '@/api/bookmark'
import { getUserIdFromToken } from '@/lib/jwt'
import { useAuthStore } from '@/store/auth'
import type { BookmarkListResponse } from '@/types/bookmark'

/** 관심 목록 쿼리 키. 토글 mutation 의 무효화 대상. */
const bookmarksKey = (userId: number | null) => ['bookmarks', userId] as const

/** userId(JWT sub) 파생 — 없으면 ApiError 로 통일. */
function requireUserId(accessToken: string | null): number {
  const userId = getUserIdFromToken(accessToken)
  if (userId == null) {
    throw new ApiError(null, '사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.')
  }
  return userId
}

/**
 * 내 관심 이벤트 목록 (등록 최근순). userId 는 accessToken(JWT sub)에서 파생하므로
 * 로그인 전에는 비활성화된다.
 */
export function useMyBookmarks(enabled = true) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = getUserIdFromToken(accessToken)
  return useQuery<BookmarkListResponse, ApiError>({
    queryKey: bookmarksKey(userId),
    enabled: enabled && userId != null,
    staleTime: 30_000,
    queryFn: () => bookmarkApi.list(userId as number),
  })
}

/**
 * 내가 관심 등록한 eventId 집합. 상세/지도 카드의 초기 찜 상태 판별에 쓴다.
 * 목록을 아직 안 불러왔으면 빈 집합.
 */
export function useBookmarkedIds(enabled = true): Set<number> {
  const { data } = useMyBookmarks(enabled)
  return useMemo(() => new Set((data?.content ?? []).map((e) => e.eventId)), [data])
}

/** 찜 토글 변수 — next=등록하려는 상태(true=등록, false=해제). */
type ToggleVars = { eventId: number; next: boolean }

/**
 * 관심 등록/해제 토글. next(원하는 상태)에 따라 add/remove 를 호출한다(둘 다 멱등).
 * 성공 시 관심 목록·마이페이지 카운트 캐시를 무효화한다.
 */
export function useToggleBookmark() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  return useMutation<string, ApiError, ToggleVars>({
    mutationFn: ({ eventId, next }) => {
      const userId = requireUserId(accessToken)
      return next ? bookmarkApi.add(userId, eventId) : bookmarkApi.remove(userId, eventId)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookmarks'] })
      void qc.invalidateQueries({ queryKey: ['mypage'] })
    },
  })
}
