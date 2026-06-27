import { apiClient } from '@/api/client'
import type { MyDataAccountsResponse, MyDataBalanceResponse } from '@/types/api'

/**
 * 마이데이터 mock provider 호출.
 * 서버가 ResponseDTO 로 감싸지 않고 표준 스펙(snake_case + rsp_code) 그대로 응답하므로
 * unwrap 을 거치지 않고 axios response.data 를 그대로 반환한다.
 */
export const mydataApi = {
  accounts: async () => {
    const res = await apiClient.get<MyDataAccountsResponse>('/v1/mydata/accounts')
    return res.data
  },

  balance: async (accountNum: string) => {
    const res = await apiClient.get<MyDataBalanceResponse>(
      `/v1/mydata/accounts/${encodeURIComponent(accountNum)}/balances`,
    )
    return res.data
  },
}