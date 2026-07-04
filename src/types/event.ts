/** 이벤트 지도 API 타입. (GET /v1/events/map, /v1/events/map/within) */

/** 이벤트 카테고리 (서버 enum). string 으로 두되 알려진 값은 EVENT_CATEGORIES 참고. */
export type EventCategory = string

/** 이벤트 상태 (서버 enum). */
export type EventStatus = 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'PENDING_DELETION'

/** 생성/필터에 쓰는 알려진 카테고리 + 한글 라벨. */
export const EVENT_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'CAFE', label: '카페' },
  { value: 'SUBWAY', label: '지하철' },
  { value: 'DIGITAL_SIGNAGE', label: '전광판' },
  { value: 'BUS', label: '버스' },
  { value: 'BANNER', label: '현수막' },
  { value: 'ONLINE', label: '온라인' },
]

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_CATEGORIES.map((c) => [c.value, c.label]),
)

/** 카테고리 코드 → 한글 라벨 (모르면 코드 그대로). */
export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}

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

/** ===== 지도 히스토리 (GET /v1/events/map/history) =====
 *  종료된 이벤트를 법정동별로 집계 — 최다 개최 아티스트 + 프로젝트/참여자 수. */

/** 법정동에서 가장 많이 열린 아티스트. 아바타는 imageUrl. */
export interface HistoryTopArtist {
  artistId: number
  name: string
  imageUrl: string
}

/** 히스토리 — 법정동별 한 줄. 경계 폴리곤은 legalDongCode 로 프론트가 렌더. */
export interface EventHistoryDistrict {
  siDo: string
  siGunGu: string
  legalDong: string
  legalDongCode: string
  artist: HistoryTopArtist
  projectCount: number
  participantCount: number
}

export interface EventHistoryResponse {
  districts: EventHistoryDistrict[]
}

/** ===== 이벤트 목록 (GET /v1/events?status&category&page&size) ===== */

/** 목록 카드용 요약 한 줄. */
export interface EventListItem {
  eventId: number
  title: string
  category: EventCategory
  status: EventStatus
  representativeImageUrl: string
  targetAmount: number
  currentAmount: number
  fundingRate: number
  startDate: string
  endDate: string
  siDo: string
  siGunGu: string
}

/** 서버 페이지 응답 (Spring Page 요약). */
export interface EventListResponse {
  content: EventListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** 목록 조회 쿼리 파라미터. status·category 미지정 시 전체. */
export interface EventListQuery {
  status?: EventStatus
  category?: string
  page?: number
  size?: number
}

/** 지도 viewport 사각형 범위 (남서 sw, 북동 ne) */
export interface MapBounds {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}

/** ===== 이벤트 생성 (POST /v1/events?userId=) =====
 *  위치는 2개 경로:
 *   - AI 추천: selectedVenueId 만 주면 서버가 venue 위치를 자동복사(create_type=AI)
 *   - 직접 입력: selectedVenueId 없이 지도에서 받은 latitude·longitude(+행정구역)를 보냄(create_type=MANUAL)
 *  selectedVenueId 와 위치 직접입력 필드는 상호배타적으로 사용한다. */
export interface CreateEventRequest {
  title: string
  description: string
  category: EventCategory
  /** 모금 시작일 (YYYY-MM-DD). 기간 유효성 실패 시 status 4002 */
  startDate: string
  /** 모금 종료일 (YYYY-MM-DD) */
  endDate: string
  /** 목표 모금액(원) */
  targetAmount: number
  /** 대표사진 fileId — 본인이 업로드한 미연결 파일만(6004/6005) */
  representativeFileId?: number
  /** [AI 경로] 선택한 venue id. 주면 위치 자동복사·create_type=AI. 없으면 status 5000 */
  selectedVenueId?: number
  /** [MANUAL 경로] 위도 */
  latitude?: number
  /** [MANUAL 경로] 경도 */
  longitude?: number
  /** [MANUAL 경로] 도로명/지번 주소 */
  address?: string
  /** [MANUAL 경로] 시/도 */
  siDo?: string
  /** [MANUAL 경로] 시/군/구 */
  siGunGu?: string
  /** [MANUAL 경로] 법정동 명 */
  legalDong?: string
  /** [MANUAL 경로] 법정동 코드 */
  legalDongCode?: string
}

export interface CreateEventResponse {
  eventId: number
}

/** ===== 이벤트 단건 상세 (GET /v1/events/{eventId}) =====
 *  참여 화면용. 없으면 status 4000. */
export interface EventDetailResponse {
  eventId: number
  creatorId: number
  /** 총대(생성자)의 하나은행 본인인증 여부 */
  creatorHanaVerified: boolean
  title: string
  description: string
  category: EventCategory
  /** 대표 이미지 URL */
  representativeImageUrl: string
  /** 목표 모금액(원) */
  targetAmount: number
  /** 현재 모금액(원) */
  currentAmount: number
  /** 모금률(%) */
  fundingRate: number
  /** 모금 상태 (ONGOING 등 서버 enum) */
  status: string
  /** 모금 시작일 (YYYY-MM-DD) */
  startDate: string
  /** 모금 종료일 (YYYY-MM-DD) */
  endDate: string
  address: string
  latitude: number
  longitude: number
  siDo: string
  siGunGu: string
  legalDong: string
}

/** ===== 모금 참여 (POST /v1/events/{eventId}/participate?userId=) ===== */
export interface ParticipateRequest {
  /** 참여 금액(원) */
  amount: number
}

export interface ParticipateResponse {
  participationId: number
  eventId: number
  /** 참여 확정 금액(원) */
  amount: number
  /** 참여 상태 (PENDING_DEPOSIT → 입금 확정 시 ACTIVE) */
  status: string
  /** 참여 시각 (ISO 8601) */
  participatedAt: string
  /** 에스크로 입금 승인 트랜잭션 해시 */
  txHash: string
  /** 해당 트랜잭션의 익스플로러 링크 */
  explorerTxUrl: string
  /** 이벤트 에스크로 주소 익스플로러 링크 */
  eventEscrowUrl: string
}

/** ===== 사용 계획 (예산) — /v1/events/{eventId}/budgets =====
 *  총대가 모인 돈의 지출 항목을 계획. 집행/환불은 이 계획 기준(M4). */

/** 사용 계획 항목 상태. PENDING(계획) · CANCELLED(취소·기록보존) · EXECUTED(집행) · REFUNDED(환불). */
export type BudgetStatus = 'PENDING' | 'CANCELLED' | 'EXECUTED' | 'REFUNDED'

/** 사용 계획 항목 한 줄 (조회 응답). vendorAccount 는 응답에서 제외. */
export interface BudgetItem {
  budgetId: number
  /** 지출 항목 제목 */
  title: string
  /** 예상 금액(원) */
  amount: number
  /** 집행 예정일 (YYYY-MM-DD) */
  scheduledDate: string
  /** 업체명 */
  vendorName: string
  /** 항목 상태 */
  status: BudgetStatus
  /** 집행 트랜잭션 해시 (집행 전엔 비어있음) */
  txHash: string
}

/** 사용 계획 전체 (항목 목록 + 합계). 생성/수정/취소 후에도 동일 형태로 반환. */
export interface BudgetPlanResponse {
  /** 집행 예정일순 항목 목록 */
  items: BudgetItem[]
  /** 항목 금액 합계(원) */
  totalAmount: number
}

/** 사용 계획 생성/수정 입력 항목. vendorAccount 는 생성·수정 시에만 전송. */
export interface BudgetItemInput {
  title: string
  amount: number
  /** 집행 예정일 (YYYY-MM-DD) */
  scheduledDate: string
  vendorName: string
  /** 업체 입금 계좌 (응답에는 노출되지 않음) */
  vendorAccount: string
}

/** 사용 계획 생성 요청 — 여러 지출 항목을 한 번에 등록. */
export interface CreateBudgetRequest {
  items: BudgetItemInput[]
}

/** 사용 계획 항목 수정 요청 — 단일 항목. */
export type UpdateBudgetRequest = BudgetItemInput

/** ===== 참여중인 이벤트 (GET /v1/events/participating) =====
 *  홈 캐러셀 — 내가 참여 확정(ACTIVE)한 이벤트, 마감 임박순. 환불·삭제 제외. */
export interface ParticipatingEvent {
  eventId: number
  title: string
  category: EventCategory
  status: EventStatus
  /** 대표 이미지 (없으면 플레이스홀더 표시) */
  representativeImageUrl: string | null
  targetAmount: number
  currentAmount: number
  /** 달성률(%) — 서버 계산값 */
  fundingRate: number
  participantCount: number
  /** 내 참여 금액(원) */
  myAmount: number
  /** 모금 시작일 (YYYY-MM-DD) */
  startDate: string
  /** 마감일 (YYYY-MM-DD) */
  endDate: string
  /** 마감까지 남은 일수 (D-n) */
  dDay: number
}

export interface ParticipatingEventsResponse {
  content: ParticipatingEvent[]
}
