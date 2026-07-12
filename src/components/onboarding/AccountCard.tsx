import type { ReactNode } from 'react'

interface Props {
  /** 좌측 은행 로고/아바타 (40px 내외) */
  logo: ReactNode
  /** 상품명 (예: "하나원큐 통장") */
  name: string
  /** 마스킹 계좌번호 (예: "하나 234*******1024") */
  subtext: string
  /** 잔액 표기 (예: "320,000원"). 없으면 줄 생략. */
  balanceText?: string
  /** 우측 요소 (선택 체크 등) */
  trailing?: ReactNode
  /** 있으면 button 으로 렌더 (계좌 선택) */
  onClick?: () => void
  disabled?: boolean
  /** 카드 하단 보조 문구 (예: 예적금 연동 불가 안내) */
  note?: string
}

/** 온보딩 계좌 카드 — 로고 + 상품명/마스킹 번호/잔액 + 우측 체크. */
export default function AccountCard({
  logo,
  name,
  subtext,
  balanceText,
  trailing,
  onClick,
  disabled,
  note,
}: Props) {
  const body = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
        {logo}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: '#151519',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontSize: 14,
              letterSpacing: '-0.02em',
              color: '#86869f',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {subtext}
          </span>
          {balanceText && (
            <span
              style={{
                marginTop: 4,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: '#151519',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {balanceText}
            </span>
          )}
        </div>
        {trailing && <span style={{ flexShrink: 0, display: 'flex' }}>{trailing}</span>}
      </div>
      {note && (
        <span style={{ fontSize: 14, letterSpacing: '-0.01em', color: '#e03e3e' }}>{note}</span>
      )}
    </>
  )

  const cardStyle = {
    boxSizing: 'border-box',
    width: '100%',
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 0 8px rgba(21,21,21,0.04)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  } as const

  if (!onClick) {
    return <section style={cardStyle}>{body}</section>
  }
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        all: 'unset',
        ...cardStyle,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {body}
    </button>
  )
}
