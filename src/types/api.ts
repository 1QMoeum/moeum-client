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

/** ===== 도메인 타입 — bank account (우리 자원, ResponseDTO 적용) ===== */

export interface BankAccountResponse {
  accountId: number
  accountType: 'HANA' | 'OTHER'
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