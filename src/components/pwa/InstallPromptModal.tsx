import { useState } from 'react'
import Button from '@/components/ui/Button'
import { useBeforeInstallPrompt, detectPlatform, type Platform } from '@/hooks/pwa'
import { useSwipeToDismiss } from '@/hooks/useSwipeToDismiss'

interface Props {
  open: boolean
  onDismiss: () => void
  onInstalled?: () => void
}

/**
 * PWA 홈화면 설치 안내 모달 (토스 스타일 바텀시트).
 * Android(Chrome): beforeinstallprompt 를 트리거로 재사용.
 * iOS(Safari): 이벤트 없음 → 수동 스텝 안내 (iOS 16.4+ 만 웹푸시 동작).
 */
export default function InstallPromptModal({ open, onDismiss, onInstalled }: Props) {
  const platform = detectPlatform()
  const { canPrompt, promptInstall } = useBeforeInstallPrompt()
  const [busy, setBusy] = useState(false)
  const swipe = useSwipeToDismiss({ onDismiss })

  if (!open) return null

  const handleAndroidInstall = async () => {
    setBusy(true)
    const outcome = await promptInstall()
    setBusy(false)
    if (outcome === 'accepted') onInstalled?.()
    onDismiss()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.48)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
        WebkitTapHighlightColor: 'transparent',
        animation: 'moeum-install-fade 0.2s ease',
      }}
      onClick={onDismiss}
    >
      <div
        {...swipe.handlers}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#ffffff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '10px 24px max(24px, env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          animation: 'moeum-install-slideup 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          ...swipe.style,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 36,
            height: 4,
            background: '#E5E8EB',
            borderRadius: 999,
            margin: '0 auto 28px',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
          <h2
            id="install-title"
            style={{
              margin: 0,
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#191F28',
              lineHeight: 1.35,
            }}
          >
            모음을 홈 화면에 추가하세요
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.55,
              color: '#4E5968',
              letterSpacing: '-0.015em',
              wordBreak: 'keep-all',
            }}
          >
            앱처럼 빠르게 열고, 새 알림도 놓치지 않아요.
          </p>
        </div>

        {platform === 'ios' && <IosSteps />}
        {platform !== 'ios' && (
          <AndroidActions canPrompt={canPrompt} busy={busy} onInstall={handleAndroidInstall} />
        )}

        <button
          type="button"
          onClick={onDismiss}
          style={{
            all: 'unset',
            width: '100%',
            padding: '18px 0 4px',
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 600,
            color: '#8B95A1',
            letterSpacing: '-0.015em',
          }}
        >
          다음에 할게요
        </button>
      </div>
      <style>{`
        @keyframes moeum-install-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes moeum-install-slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  )
}

function IosSteps() {
  return (
    <ol
      style={{
        margin: 0,
        padding: '18px 16px',
        background: '#F7F8FA',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        listStyle: 'none',
      }}
    >
      <IosStep n={1}>
        하단 <IosShareIcon /> <b style={{ color: '#191F28' }}>공유</b> 버튼을 눌러요
      </IosStep>
      <IosStep n={2}>
        메뉴에서 <b style={{ color: '#191F28' }}>“홈 화면에 추가”</b>를 선택해요
      </IosStep>
      <IosStep n={3}>
        오른쪽 위 <b style={{ color: '#191F28' }}>추가</b>를 눌러 완료해요
      </IosStep>
    </ol>
  )
}

function IosStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 11,
          background: '#EEF0FF',
          color: '#5B4CE6',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: '#4E5968',
          letterSpacing: '-0.015em',
          wordBreak: 'keep-all',
        }}
      >
        {children}
      </span>
    </li>
  )
}

function AndroidActions({
  canPrompt,
  busy,
  onInstall,
}: {
  canPrompt: boolean
  busy: boolean
  onInstall: () => void
}) {
  if (canPrompt) {
    return (
      <Button variant="solid" onClick={onInstall} disabled={busy}>
        {busy ? '설정 중…' : '홈 화면에 추가하기'}
      </Button>
    )
  }
  return (
    <div
      style={{
        padding: '16px 16px',
        background: '#F7F8FA',
        borderRadius: 16,
        fontSize: 14,
        lineHeight: 1.55,
        color: '#4E5968',
        letterSpacing: '-0.015em',
        wordBreak: 'keep-all',
        textAlign: 'center',
      }}
    >
      브라우저 메뉴(<b style={{ color: '#191F28' }}>⋮</b>)에서{' '}
      <b style={{ color: '#191F28' }}>홈 화면에 추가</b>를 선택해 주세요.
    </div>
  )
}

function IosShareIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5B4CE6"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: '-2px', display: 'inline-block' }}
      aria-hidden
    >
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

export type { Platform }