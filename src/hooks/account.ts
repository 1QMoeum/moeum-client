import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/api/client'
import { accountApi } from '@/api/account'
import { mydataApi } from '@/api/mydata'
import { plaidApi } from '@/api/plaid'
import { useAuthStore } from '@/store/auth'
import { isSameAccount, maskAccountNum } from '@/lib/account'
import { resolveDomesticBrand, resolvePlaidBrand, type BankBrand } from '@/constants/bankBrand'
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
 * 충전 계좌 등록(연동). 성공 시 계좌·잔액 캐시를 무효화해
 * 완료 화면(useMyAccount 컨슈머)이 stale 미연동 상태를 보지 않게 한다.
 */
/**
 * 동의(연동 가능) 계좌 목록의 공통 표현 — provider(마이데이터/Plaid) 차이를 흡수한다.
 * 계좌 선택 시트·마이페이지 내 계좌 목록에서 사용.
 */
export interface LinkableAccount {
  /** connect API 에 넘길 식별자 — 마이데이터 account_num / Plaid account_id */
  id: string
  /** 상품명 (예: "하나원큐 통장") */
  name: string
  /** 표시용 마스킹 번호 (예: "하나 234*******1024") */
  displayNumber: string
  /** 표시용 잔액 (예: "320,000원" / "1,250.00 USD") */
  balanceText: string
  /** 충전 계좌로 등록 가능 여부 (예적금·카드 제외) */
  linkable: boolean
  /** 아바타 — 'HANA' 는 하나 로고, 그 외 브랜드 색/이니셜 */
  brand: 'HANA' | BankBrand
}

/**
 * 이미 동의를 마친 provider 계좌 전체 목록 + 잔액.
 * 계좌 변경 시 동의 화면을 다시 거치지 않고 이 목록에서 바로 고른다
 * (새 계좌 추가/재동의만 consent 플로우로).
 */
export function useLinkableAccounts(enabled: boolean) {
  const userType = useAuthStore((s) => s.userType)
  return useQuery<LinkableAccount[], Error>({
    queryKey: ['account', 'linkable', userType],
    enabled,
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      if (userType === 'FOREIGN') {
        const res = await plaidApi.accounts()
        return res.accounts.map((a) => ({
          id: a.account_id,
          name: a.official_name || a.name,
          displayNumber: `····${a.mask}`,
          balanceText: `${a.balances.available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${a.balances.iso_currency_code}`,
          linkable: a.type === 'depository' && (a.subtype === 'checking' || a.subtype === 'savings'),
          brand: resolvePlaidBrand(a.institution_id, a.name),
        }))
      }
      const list = await mydataApi.accounts()
      const balances = await Promise.all(
        list.account_list.map((a) => mydataApi.balance(a.account_num)),
      )
      return list.account_list.map((a, i) => {
        const brand = resolveDomesticBrand(a.account_name)
        return {
          id: a.account_num,
          name: a.account_name,
          displayNumber: `${brand.short} ${maskAccountNum(a.account_num)}`,
          balanceText: `${balances[i].balance_amt.toLocaleString('ko-KR')}원`,
          linkable: a.account_type === '1001',
          brand: brand.short === '하나' ? ('HANA' as const) : brand,
        }
      })
    },
  })
}

/**
 * 연동 계좌(BankAccountResponse)의 브랜드 판별.
 * 서버 응답엔 은행 이름이 없어(HANA/OTHER/PLAID 만) OTHER 는 동의 계좌 목록에서
 * 계좌번호 매칭으로 실제 은행(한민·새한 등)을 찾는다. 못 찾으면 null(타행 배지 폴백).
 */
export function useAccountBrand(
  account: BankAccountResponse | null | undefined,
): 'HANA' | BankBrand | null {
  const { data: linkables } = useLinkableAccounts(account?.accountType === 'OTHER')
  if (!account) return null
  if (account.accountType === 'HANA') return 'HANA'
  if (account.accountType === 'PLAID') {
    return resolvePlaidBrand(account.bankCode, account.accountHolder)
  }
  const match = linkables?.find((a) => isSameAccount(account.accountNumber, a.id))
  return match?.brand ?? null
}

export function useConnectAccount() {
  const qc = useQueryClient()
  return useMutation<BankAccountResponse, ApiError, string>({
    mutationFn: (accountIdentifier) => accountApi.connect(accountIdentifier),
    onSuccess: (account) => {
      qc.setQueryData<BankAccountResponse | null>(['account', 'me'], account)
      void qc.invalidateQueries({ queryKey: ['account'] })
    },
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