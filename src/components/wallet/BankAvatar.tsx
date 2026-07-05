import { useTranslation } from 'react-i18next'
import HanaLogo from '@/components/icons/HanaLogo'
import { resolvePlaidBrand } from '@/constants/bankBrand'
import type { BankAccountResponse } from '@/types/api'

interface Props {
  account: BankAccountResponse
  size?: number
}

/**
 * 연동 계좌 브랜드 아바타. HANA=하나 로고, PLAID=기관 색 이니셜, OTHER=타행 뱃지.
 * 지갑·충전/전환·계좌 선택에서 공용으로 쓴다.
 */
export default function BankAvatar({ account, size = 40 }: Props) {
  const { t } = useTranslation()

  if (account.accountType === 'HANA') {
    return <HanaLogo size={size} />
  }

  if (account.accountType === 'PLAID') {
    const brand = resolvePlaidBrand(account.bankCode, account.accountHolder)
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: brand.color,
          color: brand.fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: size * 0.4,
          letterSpacing: '-0.02em',
          flexShrink: 0,
        }}
      >
        {brand.short}
      </div>
    )
  }

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
