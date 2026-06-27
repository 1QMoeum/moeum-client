import { useQuery } from '@tanstack/react-query'
import { eventApi } from '@/api/events'
import type { MapBounds } from '@/types/event'

/** 줌아웃 — 법정동별 집계. 줌아웃 상태일 때만 호출. */
export function useEventMap(enabled: boolean) {
  return useQuery({
    queryKey: ['events', 'map'],
    enabled,
    staleTime: 60_000,
    queryFn: () => eventApi.map(),
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
