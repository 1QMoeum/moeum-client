/** 이벤트 지도 API 타입. (GET /v1/events/map, /v1/events/map/within) */

/** 이벤트 카테고리 (서버 enum). string 으로 두되 알려진 값은 EVENT_CATEGORIES 참고. */
export type EventCategory = string

/** 이벤트 상태 (서버 enum). */
export type EventStatus = 'ONGOING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

/** 생성/필터에 쓰는 서버 카테고리 enum + 한글 라벨 + 아이콘 이미지. (GET /v1/events category) */
export const EVENT_CATEGORIES: Array<{ value: string; label: string; img: string }> = [
  { value: 'BIRTHDAY_CAFE', label: '생일카페', img: '/categories/cafe.png' },
  { value: 'AD', label: '광고', img: '/categories/ad.png' },
  { value: 'GIFT', label: '선물', img: '/categories/gift.png' },
  { value: 'COFFEE_TRUCK', label: '커피차', img: '/categories/coffeetruck.png' },
  { value: 'GOODS', label: '굿즈', img: '/categories/goods.png' },
  { value: 'DONATION', label: '기부금', img: '/categories/donation.png' },
  { value: 'WREATH', label: '화환', img: '/categories/wreath.png' },
]

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_CATEGORIES.map((c) => [c.value, c.label]),
)
const CATEGORY_IMAGES: Record<string, string> = Object.fromEntries(
  EVENT_CATEGORIES.map((c) => [c.value, c.img]),
)

/** 카테고리 코드 → 한글 라벨 (모르면 코드 그대로). */
export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}

/** 카테고리 코드 → 아이콘 이미지 경로 (모르는 코드는 undefined). */
export function categoryImage(category: string): string | undefined {
  return CATEGORY_IMAGES[category]
}

/**
 * 달성률(%) 0~100 정수. 서버 `fundingRate` 는 스케일이 불안정하므로(0~1 비율로 내려옴)
 * 신뢰하지 않고 실제 금액(currentAmount/targetAmount)에서 직접 계산한다.
 * 목표가 0 이하면 0% 로 본다.
 */
export function fundingPercent(currentAmount: number, targetAmount: number): number {
  if (!targetAmount || targetAmount <= 0) return 0
  return Math.min(100, Math.round((currentAmount / targetAmount) * 100))
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
  representativeImageUrl: string | null
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

/** 소개 갤러리 이미지 한 장. url=표시용, fileId=수정 유지용, seq=정렬 순서. */
export interface IntroImage {
  fileId: number
  url: string
  seq: number
}

/** ===== 이벤트 단건 상세 (GET /v1/events/{eventId}) =====
 *  참여 화면용. 없으면 status 4000. */
export interface EventDetailResponse {
  eventId: number
  creatorId: number
  /** 총대(생성자)의 하나은행 본인인증 여부 */
  creatorHanaVerified: boolean
  title: string
  /** 생성 시 적는 짧은 이벤트 소개. 원(대표 이미지) 아래 문구로만 사용. */
  description: string
  /** 소개 탭 본문(글). 이벤트 수정에서 별도로 작성·저장. 미작성 시 null */
  detailDescription: string | null
  /** 소개 첨부 이미지(갤러리). seq 순서로 정렬해 표시. 수정 시 fileId 로 기존 이미지 유지. */
  introImages?: IntroImage[]
  category: EventCategory
  /** 대표 이미지 URL */
  representativeImageUrl: string
  /** 목표 모금액(원) */
  targetAmount: number
  /** 현재 모금액(원) */
  currentAmount: number
  /** 모금률 (0~1 비율. 예: 0.3333) */
  fundingRate: number
  /** 참여자 수 */
  participantCount: number
  /** 모금 상태 (ONGOING 등 서버 enum) */
  status: string
  /** 모금 시작일 (YYYY-MM-DD) */
  startDate: string
  /** 모금 종료일 (YYYY-MM-DD) */
  endDate: string
  /** 진행(이벤트) 시작 날짜 (YYYY-MM-DD). 생성 시엔 없고 수정에서 입력. 미설정 시 null */
  operatingStartDate: string | null
  /** 진행(이벤트) 종료 날짜 (YYYY-MM-DD, ≥ operatingStartDate). 미설정 시 null */
  operatingEndDate: string | null
  /** 진행 시작 시간 ("HH:mm:ss", 미설정 시 null) */
  operatingStartTime: string | null
  /** 진행 종료 시간 ("HH:mm:ss", 미설정 시 null) */
  operatingEndTime: string | null
  address: string
  latitude: number
  longitude: number
  siDo: string
  siGunGu: string
  legalDong: string
}

/** ===== 이벤트 수정 (PATCH /v1/events/{eventId}) — 총대만 =====
 *  소개 글·진행 날짜/시간·소개 사진 갱신. 모금 기간(startDate/endDate)·목표금액·위치·카테고리는
 *  수정 대상이 아니다. 응답은 EventDetailResponse 전체. */
export interface UpdateEventRequest {
  /** 소개 탭 본문(글, 최대 5000자, 선택). 생성 시 description 과는 별개 필드. */
  detailDescription?: string
  /** 소개 첨부 이미지 fileId 목록(선택). 사전 업로드된 fileId, 완전 교체. */
  introImageFileIds?: number[]
  /** 진행(이벤트) 시작 날짜 (YYYY-MM-DD, 선택). 수정에서 처음 입력. */
  operatingStartDate?: string
  /** 진행(이벤트) 종료 날짜 (YYYY-MM-DD, ≥ operatingStartDate, 선택) */
  operatingEndDate?: string
  /** 진행 시작 시간 (HH:mm, 선택) */
  operatingStartTime?: string
  /** 진행 종료 시간 (HH:mm, 선택) */
  operatingEndTime?: string
}

/** ===== 이벤트 취소 + 환불 (POST /v1/events/{eventId}/cancel) — 총대만 =====
 *  PENDING 사용계획을 취소하고, 미집행 잔액(모금액−집행합)을 참여자에게 비례 환불(에스크로→지갑, 내림).
 *  이미 집행된 건은 되돌리지 않는다. 총대아님 4006 · 진행중아님 4004. */
export interface CancelEventResponse {
  eventId: number
  /** 취소 후 이벤트 상태 (CANCELLED) */
  status: EventStatus
  /** 이미 집행되어 환불되지 않은 총액(원) */
  executedTotal: number
  /** 참여자에게 환불된 총액(원) */
  refundedTotal: number
  /** 환불 처리된 참여자 수 */
  refundedCount: number
}

/** ===== 정산 거래내역 (GET /v1/events/{eventId}/settlement) — 참여자/총대만 =====
 *  입금(모금 참여) + 출금(집행) 내역과 합계. 미참여 시 4001. */

/** 입금 상태. ACTIVE(참여) · REFUNDED(환불됨). */
export type DepositStatus = 'ACTIVE' | 'REFUNDED'

/** 입금(모금 참여) 한 건. name 은 서버에서 마스킹된 이름. */
export interface SettlementDeposit {
  name: string
  amount: number
  /** 참여 시각 (ISO 8601) */
  date: string
  status: DepositStatus
}

/** 출금(집행) 한 건. */
export interface SettlementExecution {
  title: string
  amount: number
  /** 집행 시각 (ISO 8601) */
  executedAt: string
}

export interface SettlementResponse {
  deposits: SettlementDeposit[]
  executions: SettlementExecution[]
  /** 총 모금액(원) */
  totalDeposit: number
  /** 총 집행액(원) */
  totalExecuted: number
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

/** ===== 이벤트 공지 (EventPost) — /v1/events/{eventId}/posts =====
 *  총대가 남기는 소식(카페 계약·영수증 등). 참여자에게 알림 발송. */

/** 공지 한 건. imageUrls 는 첨부 이미지(없으면 빈 배열). */
export interface EventPost {
  postId: number
  eventId: number
  /** 작성자(총대) id */
  creatorId: number
  title: string
  content: string
  /** 첨부 이미지 URL 목록 */
  imageUrls: string[]
  /** 첨부 이미지 fileId 목록 (imageUrls 와 같은 순서). 수정 시 기존 이미지 유지에 사용. */
  imageFileIds?: number[]
  /** 작성 시각 (ISO 8601) */
  createdAt: string
  /** 수정 시각 (ISO 8601) */
  updatedAt: string
}

/** 공지 목록 — 최신순 Slice 페이징(다음 페이지 존재 여부만). */
export interface EventPostSlice {
  content: EventPost[]
  hasNext: boolean
}

/** 공지 작성/수정 요청. fileIds 는 사전에 /v1/files 로 업로드된 TEMP 파일 id. */
export interface PostInput {
  title: string
  content: string
  /** 첨부 이미지 fileId 목록 (수정 시 완전 교체) */
  fileIds: number[]
}

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

/** ===== 운영중인 이벤트 (GET /v1/events/operating) =====
 *  내가 만든(총대) 진행중(ONGOING) 이벤트, 최신순. 삭제 제외. */
export interface OperatingEvent {
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
  /** 모금 시작일 (YYYY-MM-DD) */
  startDate: string
  /** 마감일 (YYYY-MM-DD) */
  endDate: string
  /** 마감까지 남은 일수 (D-n) */
  dDay: number
}

export interface OperatingEventsResponse {
  content: OperatingEvent[]
}
