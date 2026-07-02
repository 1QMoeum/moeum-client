import { apiClient, unwrap } from '@/api/client'
import type { VenueDetailResponse, VenueRecommendationResponse } from '@/types/venue'

export const venueApi = {
  /**
   * 장소 추천 (AI 하이브리드 검색) — 자연어 질의(가격·지역·분위기)를 LLM 이 해석해
   * 상위 5개 + 유사도·추천 이유를 반환한다.
   */
  recommend: (query: string) =>
    unwrap<VenueRecommendationResponse>(apiClient.post('/v1/venues/recommend', { query })),

  /** 장소 단건 상세 — 플랜 상세 화면용. */
  detail: (venueId: number) =>
    unwrap<VenueDetailResponse>(apiClient.get(`/v1/venues/${venueId}`)),
}
