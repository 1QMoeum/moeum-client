import { apiClient, unwrap } from '@/api/client'
import type { BankAccountResponse } from '@/types/api'

/**
 * 계좌 연동은 국내·외국 공용 엔드포인트.
 * body 필드명 `accountIdentifier` — 국내 마이데이터의 account_num, 외국 Plaid 의 account_id
 * 둘 다 이 필드로 보낸다(서버가 사용자 유형으로 provider 분기).
 */
export const accountApi = {
  connect: (accountIdentifier: string) =>
    unwrap<BankAccountResponse>(
      apiClient.post('/v1/users/me/accounts', { accountIdentifier }),
    ),

  myAccount: () =>
    unwrap<BankAccountResponse | null>(apiClient.get('/v1/users/me/accounts')),
}