import type { ButtonHTMLAttributes } from 'react'
import { useState } from 'react'

/**
 * 공통 버튼. 로고 그라데이션(cyan→purple)을 그대로 살림.
 * 디자인 토큰 들어오면 갈아낄 자리.
 */
export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { style, disabled, children, ...rest } = props
  const [pressed, setPressed] = useState(false)

  const bg = disabled
    ? '#e5e7eb'
    : pressed
      ? 'linear-gradient(135deg, #4DC9C9 0%, #977BE5 100%)'
      : 'linear-gradient(135deg, #5DD9D9 0%, #A78BFA 100%)'

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
        color: disabled ? '#9ca3af' : '#ffffff',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        fontWeight: 600,
        fontSize: 16,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 0.12s ease, filter 0.12s ease',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        boxShadow: disabled
          ? 'none'
          : '0 4px 14px 0 rgba(167, 139, 250, 0.25)',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
