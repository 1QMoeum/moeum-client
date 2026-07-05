import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/api/client'
import { accountApi } from '@/api/account'
import { mydataApi } from '@/api/mydata'
import { plaidApi } from '@/api/plaid'
import type { BankAccountResponse } from '@/types/api'

/** 마이데이터 성공 응답 코드. 이 값이 아니면 잔액을 신뢰하지 않는다. */
const MYDATA_OK = '00000'

/**
 * 통합 잔액 응답 — 국내/외국 provider 별 응답 형태를 하나로 정규화.
 * `currency` 는 ISO 4217 (KRW / USD).
 */
export interface AccountBalance {
  available: number
  currency: string
}

/** 내 충전 계좌 조회. 미연동이면 data 는 null(정상 빈 상태). */
export function useMyAccount(enabled: boolean) {
  return useQuery<BankAccountResponse | null, ApiError>({
    queryKey: ['account', 'me'],
    enabled,
    staleTime: 30_000,
    retry: false,
    queryFn: () => accountApi.myAccount(),
  })
}

/**
 * 연동 계좌의 provider 잔액 조회. account 가 있을 때만 동작한다.
 * account.accountType 으로 mydata(HANA/OTHER) vs plaid(PLAID) 를 갈라 호출하고
 * 응답을 공통 shape 로 정규화해 컨슈머(WalletPage 등)가 provider 를 몰라도 되게 한다.
 * mydata mock 은 공용 응답 포맷이 아니라 rsp_code 로 성공을 판별하므로 실패는 throw.
 */
export function useAccountBalance(account: BankAccountResponse | null | undefined) {
  return useQuery<AccountBalance | null, Error>({
    queryKey: ['account', 'balance', account?.accountType, account?.accountNumber],
    enabled: !!account,
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      if (!account) return null
      if (account.accountType === 'PLAID') {
        const res = await plaidApi.balance(account.accountNumber)
        return {
          available: res.account.balances.available,
          currency: res.account.balances.iso_currency_code,
        }
      }
      const res = await mydataApi.balance(account.accountNumber)
      if (res.rsp_code !== MYDATA_OK) {
        throw new Error(res.rsp_msg || '잔액 조회에 실패했습니다.')
      }
      return { available: res.available_amt, currency: 'KRW' }
    },
  })
}