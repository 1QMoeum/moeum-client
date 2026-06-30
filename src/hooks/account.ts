import { useQuery } from '@tanstack/react-query'
import type { ApiError } from '@/api/client'
import { accountApi } from '@/api/account'
import { mydataApi } from '@/api/mydata'
import type { BankAccountResponse, MyDataBalanceResponse } from '@/types/api'

/** 마이데이터 성공 응답 코드. 이 값이 아니면 잔액을 신뢰하지 않는다. */
const MYDATA_OK = '00000'

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
 * 연동 계좌의 마이데이터 잔액 조회. accountNum 이 있을 때만 동작한다.
 * mydata mock 은 ResponseDTO 가 아니라 rsp_code 로 성공을 판별하므로,
 * 성공 코드가 아니면 throw 해 화면에서 잔액을 감춘다.
 */
export function useAccountBalance(accountNum: string | undefined) {
  return useQuery<MyDataBalanceResponse, Error>({
    queryKey: ['account', 'balance', accountNum],
    enabled: !!accountNum,
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const res = await mydataApi.balance(accountNum!)
      if (res.rsp_code !== MYDATA_OK) {
        throw new Error(res.rsp_msg || '잔액 조회에 실패했습니다.')
      }
      return res
    },
  })
}
