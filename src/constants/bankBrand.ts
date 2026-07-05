/**
 * 계좌 브랜드(색·이니셜) 조회. Plaid `institution_id` 기반.
 * PlaidAccountsPage 목록 카드 + OnboardingPage/WalletPage 연동 계좌 뱃지에서 공용으로 사용.
 * 국내(HANA/OTHER)는 별도 아이콘/뱃지 컴포넌트를 쓰므로 이 테이블엔 포함하지 않는다.
 */
export interface BankBrand {
  short: string
  display: string
  color: string
  fg: string
}

export const PLAID_INSTITUTION_BRAND: Record<string, BankBrand> = {
  ins_109508: { short: 'C', display: 'Chase', color: '#117ACA', fg: '#ffffff' },
  ins_127989: { short: 'B', display: 'Bank of America', color: '#E31837', fg: '#ffffff' },
  ins_117650: { short: 'H', display: 'HSBC', color: '#DB0011', fg: '#ffffff' },
  ins_127991: { short: 'W', display: 'Wells Fargo', color: '#D71E28', fg: '#ffffff' },
}

const FALLBACK: BankBrand = {
  short: '·',
  display: 'Bank',
  color: '#b0b8c1',
  fg: '#ffffff',
}

export function resolvePlaidBrand(institutionId: string | null | undefined, fallbackName?: string): BankBrand {
  if (institutionId && PLAID_INSTITUTION_BRAND[institutionId]) {
    return PLAID_INSTITUTION_BRAND[institutionId]
  }
  if (fallbackName) {
    return { ...FALLBACK, short: fallbackName.charAt(0).toUpperCase() || FALLBACK.short }
  }
  return FALLBACK
}
