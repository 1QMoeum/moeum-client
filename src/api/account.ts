import { apiClient, unwrap } from '@/api/client'
import type { BankAccountResponse } from '@/types/api'

export const accountApi = {
  connect: (accountNum: string) =>
    unwrap<BankAccountResponse>(
      apiClient.post('/v1/users/me/accounts', { accountNum }),
    ),

  myAccount: () =>
    unwrap<BankAccountResponse | null>(apiClient.get('/v1/users/me/accounts')),
}