/** 서버 공통 응답 포맷 (ResponseDTO). 모든 응답이 이 모양으로 감쌈 — HTTP 200 + 본문의 success/status. */
export interface ApiResponse<T> {
  success: boolean
  data: T | null
  status: number | null
  message: string | null
}

/** ===== 도메인 타입 — auth ===== */

export interface KycVerifyResponse {
  newUser: boolean
  name: string
}

/** Step 1 — 여권 OCR + MRZ 추출 결과. passportNumber 는 응답 미노출. */
export interface KycForeignPassportResponse {
  newUser: boolean
  name: string
  passportCountry: string
  /** ISO date string (YYYY-MM-DD) */
  expiryAt: string
}

/** Step 2 — 여권 사진 얼굴 vs 셀피 얼굴 유사도(0~100). 임계값 미만이면 서버가 2017 로 거절한다. */
export interface KycForeignFaceResponse {
  similarity: number
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
}

/** ===== 도메인 타입 — mydata (mock, 표준 스펙 그대로 snake_case) ===== */

export interface MyDataAccountListItem {
  account_num: string
  is_consent: boolean
  account_name: string
  account_type: string
  account_status: string
}

export interface MyDataAccountsResponse {
  rsp_code: string
  rsp_msg: string
  search_timestamp: number
  account_cnt: number
  account_list: MyDataAccountListItem[]
}

export interface MyDataBalanceResponse {
  rsp_code: string
  rsp_msg: string
  search_timestamp: number
  account_num: string
  balance_amt: number
  available_amt: number
}

/** ===== 도메인 타입 — plaid (외국인 mock, Plaid 표준 스펙 그대로 snake_case) =====
 *  서버가 공용 응답 포맷으로 감싸지 않고 raw 반환. */

export interface PlaidBalances {
  current: number
  available: number
  iso_currency_code: string
}

export interface PlaidAccountListItem {
  account_id: string
  balances: PlaidBalances
  mask: string
  name: string
  official_name: string
  /** 예: 'depository' / 'credit' / 'loan' / 'investment'. 연동은 depository 만 통과 */
  type: string
  /** 예: 'checking' / 'savings' / 'credit card'. 연동은 checking/savings 만 통과 */
  subtype: string
  /** Plaid 표준은 계좌 레벨 필드가 아니나, mock 은 은행 섞여있어 계좌별 브랜드 렌더용으로 실려온다. */
  institution_id: string
}

export interface PlaidItem {
  institution_id: string
  item_id: string
}

export interface PlaidAccountsResponse {
  accounts: PlaidAccountListItem[]
  item: PlaidItem
  request_id: string
}

export interface PlaidBalanceResponse {
  account: {
    account_id: string
    balances: PlaidBalances
  }
  request_id: string
}

/** ===== 도메인 타입 — bank account (우리 자원, ResponseDTO 적용) ===== */

export interface BankAccountResponse {
  accountId: number
  /** HANA/OTHER = 국내 마이데이터 연동, PLAID = 외국인 Plaid 연동 */
  accountType: 'HANA' | 'OTHER' | 'PLAID'
  bankCode: string
  accountNumber: string
  accountHolder: string
}

/** ===== 도메인 타입 — wallet (커스터디 지갑, ResponseDTO 적용) =====
 *  서버 WalletResponse DTO 기준. 개인키는 절대 내려오지 않는다.
 *  (서버 필드명이 다르면 이 인터페이스만 맞추면 페이지/훅은 그대로 동작) */
export interface WalletResponse {
  /** 커스터디 지갑 주소 (0x…) */
  walletAddress: string
  /** 예금토큰 잔액 — DB 캐시값 (서버 BigDecimal → JSON number) */
  tokenBalance: number
  /** 블록 익스플로러 주소 링크 */
  explorerUrl: string
}

/** 충전(charge)·전환(withdraw) 공통 요청 본문. idempotencyKey 로 이중 처리를 방지한다. */
export interface WalletTxRequest {
  /** 금액(원). charge=발행할 원화, withdraw=소각할 예금토큰 */
  amount: number
  /** 멱등키 — 같은 키의 재요청은 한 번만 처리된다 (UUID) */
  idempotencyKey: string
}

/** 충전·전환 결과. 갱신된 잔액과 온체인 트랜잭션 정보. */
export interface WalletTxResponse {
  /** 처리 후 예금토큰 잔액 */
  tokenBalance: number
  /** 온체인 트랜잭션 해시 */
  txHash: string
  /** 해당 트랜잭션의 익스플로러 링크 */
  explorerTxUrl: string
}