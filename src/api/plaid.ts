import { ApiError, apiClient } from '@/api/client'
import type { PlaidAccountsResponse, PlaidBalanceResponse } from '@/types/api'

/**
 * Plaid mock provider 호출 (외국인 자국 계좌).
 * 서버가 공용 응답 포맷으로 감싸지 않고 Plaid 표준 스펙(snake_case) 그대로 응답하므로
 * unwrap 을 거치지 않고 axios response.data 를 그대로 반환한다. 마이데이터 mock 과 대칭.
 *
 * 단, 서버가 예외를 던지면 GlobalExceptionHandler 가 공용 ResponseDTO({success:false, ...})
 * 를 200 으로 내려주므로 그 경우엔 ApiError 로 변환한다.
 */
function throwIfEnvelopedError(body: unknown): void {
  if (
    body &&
    typeof body === 'object' &&
    'success' in body &&
    (body as { success: unknown }).success === false
  ) {
    const b = body as { status?: number | null; message?: string }
    throw new ApiError(b.status ?? null, b.message ?? '요청에 실패했습니다.')
  }
}

export const plaidApi = {
  accounts: async () => {
    const res = await apiClient.get<PlaidAccountsResponse>('/v1/plaid/accounts')
    throwIfEnvelopedError(res.data)
    return res.data
  },

  balance: async (accountId: string) => {
    const res = await apiClient.get<PlaidBalanceResponse>(
      `/v1/plaid/accounts/${encodeURIComponent(accountId)}/balance`,
    )
    throwIfEnvelopedError(res.data)
    return res.data
  },
}