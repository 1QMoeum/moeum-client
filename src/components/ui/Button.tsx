import type { ButtonHTMLAttributes } from 'react'
import { useState } from 'react'

type Variant = 'brand' | 'solid' | 'primary' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * - `brand` (디폴트): 모음 BI 그라데이션(cyan→purple). 홈·랜딩·진입 강조용.
   * - `solid`: `primary` 와 동일 색상(violet/500). 구 팔레트(#8B5CF6) 이관 완료 — 별칭으로 유지.
   * - `primary`: 디자인 시스템 Primary(violet/500) 단색. in-flow 기본 CTA 용.
   * - `ghost`: 테두리만 있는 투명 버튼. 파일 업로드·뒤로가기 등 보조 액션 용.
   */
  variant?: Variant
}

/** 공통 버튼. */
export default function Button(props: Props) {
  const { style, disabled, children, variant = 'brand', ...rest } = props
  const [pressed, setPressed] = useState(false)

  const bg = (() => {
    if (variant === 'ghost') {
      if (disabled) return 'transparent'
      return pressed ? 'var(--color-muted)' : 'var(--color-surface)'
    }
    if (disabled) return '#e5e7eb'
    if (variant === 'primary' || variant === 'solid') return pressed ? '#574de6' : '#665bf7'
    return pressed
      ? 'linear-gradient(135deg, #4DC9C9 0%, #977BE5 100%)'
      : 'linear-gradient(135deg, #5DD9D9 0%, #A78BFA 100%)'
  })()

  const shadow =
    disabled || variant === 'ghost'
      ? 'none'
      : variant === 'primary' || variant === 'solid'
        ? '0 4px 14px 0 rgba(102, 91, 247, 0.30)'
        : '0 4px 14px 0 rgba(167, 139, 250, 0.25)'

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => !disabled && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      {...rest}
      style={{
        width: '100%',
        padding: '16px 24px',
        background: bg,
        color: disabled ? '#9ca3af' : variant === 'ghost' ? 'var(--color-text-primary)' : '#ffffff',
        border: variant === 'ghost' ? '1px solid var(--color-border)' : 'none',
        borderRadius: 'var(--radius-lg)',
        fontWeight: 600,
        fontSize: 16,
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 0.12s ease, filter 0.12s ease, background 0.12s ease',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        boxShadow: shadow,
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {children}
    </button>
  )
}