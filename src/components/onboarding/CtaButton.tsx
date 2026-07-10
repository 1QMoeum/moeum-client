import { useState } from 'react'

interface Props {
  label: string
  onClick: () => void
  /** primary = 보라 채움(#665bf7) / secondary = 흰색 + 연회색 보더 */
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

/** 온보딩 플로우 하단 CTA 버튼 (디자인 시스템 button_large — h56 · r32). */
export default function CtaButton({ label, onClick, variant = 'primary', disabled }: Props) {
  const [pressed, setPressed] = useState(false)
  const primary = variant === 'primary'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        // button 은 display:flex 여도 부모 너비로 늘어나지 않으므로 width 명시 필수.
        // (flex row 안에서는 flex:1 의 basis 0 이 우선돼 균등 분할 유지)
        width: '100%',
        flex: 1,
        height: 56,
        borderRadius: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#9ca3af' : primary ? '#ffffff' : '#474c52',
        background: disabled ? '#e5e7eb' : primary ? '#665bf7' : '#ffffff',
        border: primary || disabled ? 'none' : '1px solid #f6f6fa',
        boxShadow: disabled ? 'none' : '0 0 8px rgba(21,21,21,0.04)',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.12s ease, background 0.12s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}
