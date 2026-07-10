import { useTranslation } from 'react-i18next'
import BrandAvatar from '@/components/wallet/BrandAvatar'
import { useAccountBrand } from '@/hooks/account'
import type { BankAccountResponse } from '@/types/api'

interface Props {
  account: BankAccountResponse
  size?: number
}

/**
 * 연동 계좌 브랜드 아바타. HANA=하나 로고, OTHER=동의 계좌 목록에서 계좌번호로
 * 은행을 찾아 로고(한민·새한 등) 표시, PLAID=기관 색 이니셜. 못 찾으면 타행 뱃지.
 * 지갑·충전/전환·온보딩 완료에서 공용으로 쓴다.
 */
export default function BankAvatar({ account, size = 40 }: Props) {
  const { t } = useTranslation()
  const brand = useAccountBrand(account)

  if (brand) return <BrandAvatar brand={brand} size={size} />

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: '#0046ff',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.3,
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
    >
      {t('wallet.otherBankBadge')}
    </div>
  )
}
