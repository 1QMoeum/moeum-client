import { apiClient, unwrap } from '@/api/client'
import type { EventMapResponse, EventMapWithinResponse, MapBounds } from '@/types/event'

export const eventApi = {
  /** 지도 이벤트 집계 (줌아웃) — 진행중 이벤트를 법정동별로 집계 */
  map: () => unwrap<EventMapResponse>(apiClient.get('/v1/events/map')),

  /** 지도 영역(viewport) 진행중 이벤트 (확대) — 현재 화면 bounds 의 이벤트 전체 */
  within: (bounds: MapBounds) =>
    unwrap<EventMapWithinResponse>(apiClient.get('/v1/events/map/within', { params: bounds })),
}
