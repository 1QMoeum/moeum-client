import { apiClient, unwrap } from '@/api/client'
import type { BookmarkListResponse } from '@/types/bookmark'

export const bookmarkApi = {
  /** 관심 등록(좋아요) — 멱등. 이미 등록돼 있어도 성공(중복 생성 없음). */
  add: (userId: number, eventId: number) =>
    unwrap<string>(
      apiClient.post(`/v1/users/me/bookmarks/${eventId}`, null, { params: { userId } }),
    ),

  /** 관심 해제(좋아요 취소) — 멱등. 등록돼 있지 않아도 성공(no-op). */
  remove: (userId: number, eventId: number) =>
    unwrap<string>(apiClient.delete(`/v1/users/me/bookmarks/${eventId}`, { params: { userId } })),

  /** 내 관심 이벤트 목록 — 등록 최근순 카드. 삭제된 이벤트는 제외. */
  list: (userId: number) =>
    unwrap<BookmarkListResponse>(apiClient.get('/v1/users/me/bookmarks', { params: { userId } })),
}
