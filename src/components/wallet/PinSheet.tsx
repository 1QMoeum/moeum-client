import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'
import PinInput from '@/components/auth/PinInput'

interface Props {
  open: boolean
  /** 6자리 입력 완료 시 호출 (검증/트랜잭션은 부모가 담당). */
  onComplete: (pin: string) => void
  onClose: () => void
  /** 트랜잭션 처리 중 — 키패드 잠금 + 스피너. */
  pending?: boolean
  /** 실패 메시지 — 표시 후 입력을 초기화해 재시도를 유도. */
  error?: string | null
  onForgot?: () => void
}

/**
 * 충전·전환 확인용 비밀번호 바텀시트.
 * 디자인: "비밀번호를 눌러주세요" + 도트 + 섞인 키패드 + "비밀번호를 몰라요".
 * 6자리가 채워지면 자동으로 onComplete 를 호출한다.
 */
export default function PinSheet({ open, onComplete, onClose, pending, error, onForgot }: Props) {
  const { t } = useTranslation()
  const [pin, setPin] = useState('')

  // 열릴 때/오류가 날 때 입력 초기화 (재시도).
  useEffect(() => {
    if (open) setPin('')
  }, [open])
  useEffect(() => {
    if (error) setPin('')
  }, [error])

  if (!open) return null

  const handleChange = (next: string) => {
    if (pending) return
    setPin(next)
    if (next.length === 6) onComplete(next)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('wallet.pinPrompt')}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(17, 24, 39, 0.48)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'moeum-sheet-fade 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#ffffff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '28px 24px max(28px, env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          animation: 'moeum-sheet-slideup 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 600,
            color: '#151519',
            letterSpacing: '-0.02em',
          }}
        >
          {t('wallet.pinPrompt')}
        </h2>

        <PinInput value={pin} onChange={handleChange} disabled={pending} />

        {error ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#e03e3e',
              letterSpacing: '-0.01em',
            }}
          >
            <AlertCircle size={15} strokeWidth={2.2} />
            {error}
          </div>
        ) : pending ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#86869f', fontSize: 13 }}>
            <span className="moeum-splash-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            {t('wallet.processing')}
          </div>
        ) : (
          <button
            type="button"
            onClick={onForgot}
            style={{
              all: 'unset',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              color: '#665bf7',
              letterSpacing: '-0.01em',
              padding: 4,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {t('wallet.forgotPin')}
          </button>
        )}
      </div>
    </div>
  )
}
