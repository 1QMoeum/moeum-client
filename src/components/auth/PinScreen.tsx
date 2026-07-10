import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import PinInput, { PinDots } from '@/components/auth/PinInput'

interface Props {
  /** 뒤로가기 핸들러. 없으면 캐럿을 숨긴다. */
  onBack?: () => void
  /** 중앙 타이틀 — 여러 줄이면 \n 구분 */
  title: string
  desc?: string
  /** 있으면 도트 아래 빨간 문구 표시 + 입력을 비운다 */
  errorMessage?: string | null
  /** 서버 처리 중 — 키패드 비활성 + 상태 문구 표시 */
  pending?: boolean
  /** 처리 중 문구 (예: "로그인 중…") */
  pendingLabel?: string
  /** 6자리 입력 완료 시 자동 호출 */
  onComplete: (pin: string) => void
  /** 도트 아래 부가 요소 (업로드 UI 등) — 중앙 정렬 */
  children?: ReactNode
  /** 키패드 카드 아래 보조 액션 (비밀번호 분실 링크 등) */
  bottomAction?: ReactNode
}

/**
 * PIN 입력 화면 공용 레이아웃 — 금융앱 표준 패턴.
 * 타이틀·도트는 상단 중앙, 키패드는 하단 밀착. 별도 확인 버튼 없이
 * 6자리 입력이 끝나면 자동 제출한다. 실패하면 입력을 비우고 다시 받는다.
 */
export default function PinScreen({
  onBack,
  title,
  desc,
  errorMessage,
  pending = false,
  pendingLabel,
  onComplete,
  children,
  bottomAction,
}: Props) {
  const [pin, setPin] = useState('')
  const submittedRef = useRef(false)

  useEffect(() => {
    if (pin.length === 6 && !pending && !submittedRef.current) {
      submittedRef.current = true
      onComplete(pin)
    }
    if (pin.length < 6) {
      submittedRef.current = false
    }
  }, [pin, pending, onComplete])

  // 실패하면 입력을 비우고 처음부터 — 부분 수정보다 재입력이 빠르다
  useEffect(() => {
    if (errorMessage) {
      setPin('')
      submittedRef.current = false
    }
  }, [errorMessage])

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 20px', boxSizing: 'border-box' }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="뒤로가기"
              style={{
                all: 'unset',
                display: 'flex',
                cursor: 'pointer',
                color: '#27282c',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </header>

        {/* 타이틀은 상단, 키패드는 하단 — 사이 간격은 최대 260px 로 제한해 긴 화면에서도 안 벌어진다 */}
        <div
          style={{
            flex: 1,
            padding: '24px 20px calc(20px + env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.45,
              letterSpacing: '-0.02em',
              color: '#1c1d1f',
              whiteSpace: 'pre-line',
            }}
          >
            {title}
          </h1>
          {desc && (
            <p
              style={{
                margin: '10px 0 0',
                fontSize: 15,
                lineHeight: 1.5,
                letterSpacing: '-0.02em',
                color: '#5c5c72',
                whiteSpace: 'pre-line',
              }}
            >
              {desc}
            </p>
          )}

          <div style={{ marginTop: 32 }}>
            <PinDots value={pin} />
          </div>

          <span
            aria-live="polite"
            style={{
              marginTop: 16,
              minHeight: 22,
              fontSize: 14,
              letterSpacing: '-0.02em',
              color: errorMessage ? '#e03e3e' : '#86869f',
            }}
          >
            {errorMessage || (pending ? pendingLabel : '')}
          </span>

          {children}

          <div aria-hidden style={{ flex: 1, minHeight: 32, maxHeight: 260, width: '100%' }} />

          {/* 키패드 — 흰색 라운드 카드 (서비스 공통 카드 모티프) */}
          <div
            style={{
              marginTop: 0,
              width: '100%',
              maxWidth: 372,
              boxSizing: 'border-box',
              background: '#fff',
              borderRadius: 24,
              boxShadow: '0 0 16px rgba(21,21,21,0.04)',
              padding: '20px 16px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <PinInput value={pin} onChange={setPin} disabled={pending} showDots={false} />
          </div>

          {bottomAction && <div style={{ marginTop: 18 }}>{bottomAction}</div>}
        </div>
      </div>
    </main>
  )
}
