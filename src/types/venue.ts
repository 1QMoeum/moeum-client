/** 장소(venue) API 타입 — AI 플래너. (POST /v1/venues/recommend, GET /v1/venues/{venueId}) */

export type VenueType =
  | 'SUBWAY_MEDIA'
  | 'DIGITAL_SIGNAGE'
  | 'CAFE'
  | 'SUBWAY_DIGITAL'
  | 'BUS'
  | 'BANNER'
  | 'ONLINE'

const VENUE_TYPE_LABELS: Record<string, string> = {
  SUBWAY_MEDIA: '지하철 매체',
  DIGITAL_SIGNAGE: '전광판',
  CAFE: '카페 대관',
  SUBWAY_DIGITAL: '지하철 디지털',
  BUS: '버스 광고',
  BANNER: '현수막',
  ONLINE: '온라인',
}

/** 장소 유형 코드 → 한글 라벨 (모르면 코드 그대로). */
export function venueTypeLabel(type: string): string {
  return VENUE_TYPE_LABELS[type] ?? type
}

/** 광고형 여부 — 카페 대관 외 전부 광고 매체. */
export function isAdVenue(type: string): boolean {
  return type !== 'CAFE'
}

/**
 * 렌더 가능한 이미지 src. 서버 imageUrl 이 크롤링 원본 키(product-image/x.webp)일 수 있어
 * 절대 URL 이 아니면 undefined(플레이스홀더 표시)로 처리한다.
 */
export function venueImageSrc(imageUrl: string | null | undefined): string | undefined {
  return imageUrl && /^https?:\/\//.test(imageUrl) ? imageUrl : undefined
}

/** 추천 결과 한 줄. 유사도(similarity)순으로 내려온다. */
export interface RecommendedVenue {
  venueId: number
  venueType: VenueType
  title: string
  siDo: string
  siGunGu: string
  /** 공용 가격(원) — 광고=광고비, 카페=예약금 */
  price: number
  /** 보증금(원) — 카페만, 광고는 null */
  deposit: number | null
  imageUrl: string
  /** 코사인 유사도 (클수록 질의와 유사) */
  similarity: number
  /** AI 추천 이유 (LLM 생성 — 실패 시 null) */
  reason: string | null
}

export interface VenueRecommendationResponse {
  results: RecommendedVenue[]
}

/** 장소 단건 상세 (플랜 상세 화면용). */
export interface VenueDetailResponse {
  venueId: number
  venueType: VenueType
  venueTypeDescription: string
  title: string
  description: string
  address: string
  legalDong: string
  siDo: string
  siGunGu: string
  latitude: number
  longitude: number
  advertisingPrice: number | null
  advertisingDuration: string | null
  rentalPrice: number | null
  rentalDeposit: number | null
  rentalStartTime: string | null
  rentalEndTime: string | null
  imageUrl: string
}

/** 이벤트 생성(AI 경로)에 넘기는 최소 장소 정보 — router state 로 전달. */
export interface AiPlanVenue {
  venueId: number
  title: string
  venueType: string
  siDo: string
  siGunGu: string
  price: number
  imageUrl: string
}
