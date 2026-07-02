import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { venueApi } from '@/api/venues'
import type { VenueDetailResponse, VenueRecommendationResponse } from '@/types/venue'

/** AI 장소 추천 — 자연어 질의. LLM 검색이라 수 초 걸릴 수 있다. */
export function useRecommendVenues() {
  return useMutation<VenueRecommendationResponse, ApiError, string>({
    mutationFn: (query) => venueApi.recommend(query),
  })
}

/** 장소 단건 상세 — 플랜 상세 화면용. venueId 없으면 비활성화. */
export function useVenueDetail(venueId: number | null) {
  return useQuery<VenueDetailResponse, ApiError>({
    queryKey: ['venues', 'detail', venueId],
    enabled: venueId !== null,
    staleTime: 5 * 60_000,
    queryFn: () => venueApi.detail(venueId as number),
  })
}
