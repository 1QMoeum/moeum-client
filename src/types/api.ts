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