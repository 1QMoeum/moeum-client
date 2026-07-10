import { useMemo, type ReactNode } from 'react'
import { Delete } from 'lucide-react'

interface Props {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  /** 키패드 숫자 배열을 매번 섞어 위치 추측(숄더 서핑)을 막는다. 기본 true. */
  shuffle?: boolean
  /** 키패드 위 도트 표시 여부. 도트를 화면 상단에 따로 배치할 땐 false + PinDots 사용. */
  showDots?: boolean
}

/** PIN 자릿수 도트 — 키패드와 분리 배치용 (화면 중앙 상단 등). */
export function PinDots({ value }: { value: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: i < value.length ? VIOLET : DOT_EMPTY,
            transition: 'background 0.15s',
          }}
        />
      ))}
    </div>
  )
}

const VIOLET = '#665bf7'
const DOT_EMPTY = '#e0e0ed'

/** 0~9 를 섞는다. (금융 키패드 보안 패턴) */
function shuffled(): string[] {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  for (let i = digits.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[digits[i], digits[j]] = [digits[j], digits[i]]
  }
  return digits
}

/**
 * 금융 앱 스타일 PIN 패드. (모음 디자인 시스템)
 * - 상단: 입력된 자리수를 도트 6칸으로 표시
 * - 하단: 3x4 숫자 키패드. 숫자는 섞어서 배치, 우하단은 지우기(⌫).
 * value/onChange 로 외부 상태를 제어한다(로그인·가입·지갑 공용).
 */
export default function PinInput({ value, onChange, disabled, shuffle = true, showDots = true }: Props) {
  const dots = useMemo(() => Array.from({ length: 6 }, (_, i) => i < value.length), [value])
  // 마운트 시 한 번만 섞는다(입력 중에는 위치가 유지되도록).
  const digits = useMemo(() => (shuffle ? shuffled() : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']), [shuffle])

  // 3x4 그리드: 위 9칸 숫자, 마지막 줄은 [빈칸][10번째 숫자][지우기]
  const cells: Array<{ kind: 'digit' | 'back' | 'empty'; value?: string }> = [
    ...digits.slice(0, 9).map((d) => ({ kind: 'digit' as const, value: d })),
    { kind: 'empty' },
    { kind: 'digit', value: digits[9] },
    { kind: 'back' },
  ]

  const press = (d: string) => {
    if (disabled || value.length >= 6) return
    onChange(value + d)
  }
  const backspace = () => {
    if (disabled) return
    onChange(value.slice(0, -1))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36, alignItems: 'center', width: '100%' }}>
      {/* 도트 표시 */}
      {showDots && (
        <div style={{ display: 'flex', gap: 20, height: 12, alignItems: 'center' }}>
          {dots.map((filled, i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: filled ? VIOLET : DOT_EMPTY,
                transition: 'background 0.15s',
              }}
            />
          ))}
        </div>
      )}

      {/* 키패드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          rowGap: 4,
          columnGap: 8,
          width: '100%',
          maxWidth: 320,
        }}
      >
        {cells.map((cell, i) => {
          if (cell.kind === 'empty') {
            return <span key={i} aria-hidden style={{ height: 60 }} />
          }
          if (cell.kind === 'back') {
            return (
              <KeyButton
                key={i}
                ariaLabel="지우기"
                disabled={disabled || value.length === 0}
                onClick={backspace}
              >
                <Delete size={26} strokeWidth={1.8} color={VIOLET} />
              </KeyButton>
            )
          }
          const d = cell.value as string
          return (
            <KeyButton key={i} ariaLabel={d} disabled={disabled} onClick={() => press(d)}>
              <span style={{ fontSize: 24, fontWeight: 600, color: '#2f2f3b', letterSpacing: '-0.02em' }}>{d}</span>
            </KeyButton>
          )
        })}
      </div>
    </div>
  )
}

function KeyButton({
  children,
  ariaLabel,
  onClick,
  disabled,
}: {
  children: ReactNode
  ariaLabel: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
        opacity: disabled ? 0.4 : 1,
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.12s',
      }}
      onPointerDown={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#f2f0ff'
      }}
      onPointerUp={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
      onPointerLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
