import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

/** 둥근 모서리 + 가운데 V 노치가 파인 글래스 트레이 마스크 (viewBox 363×123). */
const TRAY_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 363 123' preserveAspectRatio='none'><path d='M16 0 H150 L181.5 30 L213 0 H347 Q363 0 363 16 V107 Q363 123 347 123 H16 Q0 123 0 107 V16 Q0 0 16 0 Z'/></svg>",
)}")`

interface Props {
  /** 예금토큰 잔액. null 이면 미로딩('…') 또는 지갑 미생성('0' — hasWallet=false). */
  balance: number | null
  hasWallet?: boolean
  /** 카드(지갑) 영역 탭 콜백 — 마이페이지에서 내 지갑으로 이동. 생략하면 탭 비활성. */
  onOpen?: () => void
  onCharge: () => void
  onWithdraw: () => void
}

/**
 * 그라데이션 예금토큰 카드 + 글래스 트레이(충전/전환 버튼) — 마이페이지·내 지갑 공용.
 * 디자인: 마이페이지 지갑 카드 (V노치 글래스 트레이).
 */
export default function WalletTokenCard({ balance, hasWallet = true, onOpen, onCharge, onWithdraw }: Props) {
  const { t, i18n } = useTranslation()
  const numberLocale = i18n.resolvedLanguage === 'ko' ? 'ko-KR' : 'en-US'

  const trayStyle: CSSProperties & { WebkitBackdropFilter?: string; WebkitMaskImage?: string } = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 123,
    // 글래스 — blur 미지원 웹뷰에서도 유리처럼 보이도록 반투명 그라데이션 + 상단 하이라이트,
    // backdrop blur(디자인 GLASS radius 6)는 지원 환경 향상 효과로만.
    background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.22) 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
    backdropFilter: 'blur(6px) saturate(1.1)',
    WebkitBackdropFilter: 'blur(6px) saturate(1.1)',
    maskImage: TRAY_MASK,
    WebkitMaskImage: TRAY_MASK,
    maskSize: '100% 100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  }

  return (
    <div
      style={{
        position: 'relative',
        height: 221,
        borderRadius: 12,
        background: 'rgba(233,231,255,0.1)',
        boxShadow: '0 0 16px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* 그라데이션 토큰 카드 — onOpen 이 있으면 탭 가능(내 지갑 이동) */}
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        aria-label={onOpen ? t('wallet.title') : undefined}
        style={{
          all: 'unset',
          boxSizing: 'border-box',
          position: 'absolute',
          left: 17,
          right: 17,
          top: 20,
          height: 185,
          borderRadius: 12,
          background: 'linear-gradient(103deg, #56d2c9 0%, #665bf7 100%)',
          boxShadow: '0 0 16px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          cursor: onOpen ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ position: 'absolute', left: 24, right: 24, top: 12 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#f6f6fa' }}>
            {t('wallet.tokenName')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1.5,
                letterSpacing: '-0.02em',
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {balance == null ? (hasWallet ? '…' : '0') : balance.toLocaleString(numberLocale)}
            </span>
            <span style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#e0e0ed' }}>
              {t('wallet.tokenUnit')}
            </span>
          </div>
        </div>
      </button>

      {/* 글래스 트레이 — 가운데 노치가 있는 반투명 패널 */}
      <div style={trayStyle}>
        <PillButton label={t('wallet.chargeCta')} variant="white" onClick={onCharge} />
        <PillButton label={t('wallet.convertCta')} variant="violet" onClick={onWithdraw} />
      </div>
    </div>
  )
}

function PillButton({
  label,
  variant,
  onClick,
}: {
  label: string
  variant: 'white' | 'violet'
  onClick: () => void
}) {
  const white = variant === 'white'
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '12px 32px',
        borderRadius: 24,
        border: 'none',
        cursor: 'pointer',
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '-0.02em',
        background: white ? '#fff' : '#665bf7',
        color: white ? '#474c52' : '#fff',
        boxShadow: '0 0 8px rgba(21,21,21,0.04)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}
