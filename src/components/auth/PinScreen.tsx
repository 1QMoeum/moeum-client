import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import PinInput from '@/components/auth/PinInput'

interface Props {
  /** 뒤로가기 핸들러. 없으면 캐럿을 숨긴다. */
  onBack?: () => void
  /** 상단 좌측 헤드라인 (예: "○○님,\n다시 만나서 반가워요!") */
  headline?: string
  /** 패널 타이틀 (예: "비밀번호를 눌러주세요") */
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
  /** 패널 위쪽 영역 부가 요소 (업로드 UI 등) */
  children?: ReactNode
  /** 키패드 아래 보조 액션 (비밀번호 분실 링크 등) */
  bottomAction?: ReactNode
}

/**
 * PIN 입력 화면 — 피그마 973:6745. 하단 흰색 바텀시트 패널 안에
 * 타이틀·도트·키패드를 모두 담는다. 별도 확인 버튼 없이 6자리 입력이
 * 끝나면 자동 제출하고, 실패하면 입력을 비우고 다시 받는다.
 */
export default function PinScreen({
  onBack,
  headline,
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

        {headline && (
          <h2
            style={{
              margin: 0,
              padding: '24px 20px 0',
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.5,
              letterSpacing: '-0.02em',
              color: '#1c1d1f',
              whiteSpace: 'pre-line',
            }}
          >
            {headline}
          </h2>
        )}

        <div style={{ flex: 1 }} />

        {children && (
          <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {children}
          </div>
        )}

        {/* 비밀번호 패널 — 흰색 바텀시트 (피그마: 타이틀 + 도트 + 키패드 일체) */}
        <div
          style={{
            background: '#fff',
            borderRadius: '32px 32px 0 0',
            boxShadow: '0 0 16px rgba(21,21,21,0.04)',
            padding: '40px 20px calc(20px + env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1.5,
              letterSpacing: '-0.02em',
              color: '#151519',
              whiteSpace: 'pre-line',
            }}
          >
            {title}
          </h1>
          {desc && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 14,
                lineHeight: 1.5,
                letterSpacing: '-0.02em',
                color: '#5c5c72',
                whiteSpace: 'pre-line',
              }}
            >
              {desc}
            </p>
          )}

          {/* 자릿수 도트 — 패널 안 작은 도트 */}
          <div style={{ display: 'flex', gap: 20, marginTop: 20, height: 8, alignItems: 'center' }}>
            {Array.from({ length: 6 }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i < pin.length ? '#665bf7' : '#e0e0ed',
                  transition: 'background 0.15s',
                }}
              />
            ))}
          </div>

          <span
            aria-live="polite"
            style={{
              marginTop: 12,
              minHeight: 20,
              fontSize: 14,
              letterSpacing: '-0.02em',
              color: errorMessage ? '#e03e3e' : '#86869f',
            }}
          >
            {errorMessage || (pending ? pendingLabel : '')}
          </span>

          <div style={{ width: '100%', maxWidth: 402, marginTop: 8 }}>
            {/* Face ID 키는 피그마 배치용 — 웹 데모라 동작 없음(앱 전환 시 생체인증 연결 지점) */}
            <PinInput value={pin} onChange={setPin} disabled={pending} showDots={false} onFaceId={() => {}} />
          </div>

          {bottomAction && <div style={{ marginTop: 16 }}>{bottomAction}</div>}
        </div>
      </div>
    </main>
  )
}
