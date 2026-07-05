/** ===== 관심 이벤트(좋아요/북마크) — /v1/users/me/bookmarks =====
 *  관심 등록(POST)·해제(DELETE)는 멱등, 목록(GET)은 등록 최근순 카드. */

import type { EventListItem } from '@/types/event'

/** 관심 이벤트 목록 — 카드 요약은 이벤트 목록 아이템과 동일 형태(모금률·기간·대표이미지·지역). */
export interface BookmarkListResponse {
  content: EventListItem[]
}
