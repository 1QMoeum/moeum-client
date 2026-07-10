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

/**
 * 국내(마이데이터) 은행 브랜드 — 계좌 상품명 부분 일치로 판별.
 * 하나원큐는 별도 로고 컴포넌트(HanaLogo)를 쓰므로 컨슈머가 short === '하나' 로 분기한다.
 */
export const DOMESTIC_BANK_BRAND: Record<string, BankBrand> = {
  '하나원큐': { short: '하나', display: '하나은행', color: '#008B84', fg: '#ffffff' },
  '새한': { short: '새한', display: '새한은행', color: '#8b7ff2', fg: '#ffffff' },
  '한민': { short: '한민', display: '한민은행', color: '#FFB800', fg: '#191f28' },
  'S은행': { short: 'S', display: 'S은행', color: '#0046FF', fg: '#ffffff' },
  'K은행': { short: 'K', display: 'K은행', color: '#FFBC00', fg: '#191f28' },
  'N은행': { short: 'N', display: 'N은행', color: '#04AA59', fg: '#ffffff' },
}

const DOMESTIC_FALLBACK: BankBrand = { short: '·', display: '계좌', color: '#b0b8c1', fg: '#ffffff' }

export function resolveDomesticBrand(accountName: string): BankBrand {
  for (const key of Object.keys(DOMESTIC_BANK_BRAND)) {
    if (accountName.includes(key)) return DOMESTIC_BANK_BRAND[key]
  }
  return DOMESTIC_FALLBACK
}
