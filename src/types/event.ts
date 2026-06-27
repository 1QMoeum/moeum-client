/** 이벤트 지도 API 타입. (GET /v1/events/map, /v1/events/map/within) */

/** 이벤트 카테고리. 알려진 값: 'CAFE' (서버 enum, 추후 확장 가능) */
export type EventCategory = string

/** 줌아웃 집계 — 법정동 대표 이벤트 */
export interface RepresentativeEvent {
  eventId: number
  title: string
  category: EventCategory
  currentAmount: number
  targetAmount: number
  latitude: number
  longitude: number
}

/** 줌아웃 집계 — 법정동별 한 줄 */
export interface EventMapDistrict {
  siDo: string
  siGunGu: string
  legalDong: string
  legalDongCode: string
  /** 대표 모금률(%) */
  fundingRate: number
  eventCount: number
  representative: RepresentativeEvent
}

export interface EventMapResponse {
  districts: EventMapDistrict[]
}

/** 확대 — viewport 안의 개별 진행중 이벤트 */
export interface ViewportEvent {
  eventId: number
  title: string
  category: EventCategory
  fundingRate: number
  currentAmount: number
  targetAmount: number
  latitude: number
  longitude: number
  legalDongCode: string
}

export interface EventMapWithinResponse {
  events: ViewportEvent[]
}

/** 지도 viewport 사각형 범위 (남서 sw, 북동 ne) */
export interface MapBounds {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}
