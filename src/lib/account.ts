/** 계좌번호 마스킹 — 앞 3자리 + ******* + 뒤 4자리 (예: 234*******1024). */
export function maskAccountNum(num: string): string {
  const digits = num.replaceAll('-', '')
  if (digits.length < 8) return num
  return `${digits.slice(0, 3)}*******${digits.slice(-4)}`
}

/** 숫자와 구분자(하이픈/공백)로만 이루어진 식별자인지 — 국내 계좌번호 판별용. */
const NUMERIC_ID = /^[\d\-\s]+$/

/**
 * 계좌 식별자 동일 여부 — 표기 차이(하이픈 유무)를 흡수한다.
 * 숫자 계좌번호(마이데이터)는 숫자만 비교, 영숫자 id(Plaid)는 원문 비교.
 */
export function isSameAccount(a: string, b: string): boolean {
  if (a === b) return true
  if (!NUMERIC_ID.test(a) || !NUMERIC_ID.test(b)) return false
  return a.replace(/\D/g, '') === b.replace(/\D/g, '')
}
