import { useMemo } from 'react'

interface Props {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

/**
 * 금융 앱 스타일 PIN 패드. (토스/카뱅/하나원큐 패턴 참고)
 * - 상단: 입력된 자리수를 도트 6칸으로 표시
 * - 하단: 3x4 숫자 키패드 (랜덤 배치는 추후, 디자인 들어오면 토큰화)
 */
export default function PinInput({ value, onChange, disabled }: Props) {
  const dots = useMemo(() => Array.from({ length: 6 }, (_, i) => i < value.length), [value])

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

  const handleKey = (key: string) => {
    if (disabled) return
    if (key === '⌫') {
      onChange(value.slice(0, -1))
    } else if (key === '' || !/\d/.test(key)) {
      return
    } else if (value.length < 6) {
      onChange(value + key)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center' }}>
      {/* 도트 표시 */}
      <div style={{ display: 'flex', gap: 16, height: 18, alignItems: 'center' }}>
        {dots.map((filled, i) => (
          <span
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: filled ? 'var(--color-primary)' : '#e5e7eb',
              transition: 'background 0.15s',
            }}
          />
        ))}
      </div>

      {/* 키패드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 72px)',
          gridGap: 16,
          justifyContent: 'center',
        }}
      >
        {keys.map((key, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleKey(key)}
            disabled={disabled || key === ''}
            aria-label={key === '⌫' ? '지우기' : key === '' ? '' : `숫자 ${key}`}
            style={{
              width: 72,
              height: 72,
              fontSize: 28,
              fontWeight: 500,
              border: 'none',
              borderRadius: '50%',
              background: key === '' ? 'transparent' : '#f3f4f6',
              color: 'var(--color-text-primary)',
              cursor: key === '' || disabled ? 'default' : 'pointer',
              visibility: key === '' ? 'hidden' : 'visible',
              userSelect: 'none',
              transition: 'background 0.1s',
            }}
            onMouseDown={(e) => {
              if (key !== '' && !disabled) {
                ;(e.target as HTMLButtonElement).style.background = '#e5e7eb'
              }
            }}
            onMouseUp={(e) => {
              if (key !== '' && !disabled) {
                ;(e.target as HTMLButtonElement).style.background = '#f3f4f6'
              }
            }}
            onMouseLeave={(e) => {
              if (key !== '' && !disabled) {
                ;(e.target as HTMLButtonElement).style.background = '#f3f4f6'
              }
            }}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}
