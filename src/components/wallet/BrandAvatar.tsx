import HanaLogo from '@/components/icons/HanaLogo'
import saehanLogo from '@/assets/banks/saehan-logo.png'
import hanminLogo from '@/assets/banks/hanmin-logo.png'
import type { LinkableAccount } from '@/hooks/account'

/** 로고 이미지를 보유한 국내 은행 (brand.short 기준). 나머지는 색 이니셜 원으로 폴백. */
const DOMESTIC_LOGO: Record<string, string> = {
  '새한': saehanLogo,
  '한민': hanminLogo,
}

/** LinkableAccount.brand → 아바타 (하나/새한/한민 로고, 그 외 브랜드 색 이니셜). */
export default function BrandAvatar({
  brand,
  size = 36,
}: {
  brand: LinkableAccount['brand']
  size?: number
}) {
  if (brand === 'HANA') return <HanaLogo size={size} />

  const logo = DOMESTIC_LOGO[brand.short]
  if (logo) {
    return (
      <img
        src={logo}
        alt={brand.display}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      />
    )
  }

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
        fontSize: brand.short.length > 1 ? size * 0.3 : size * 0.42,
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
    >
      {brand.short}
    </div>
  )
}
