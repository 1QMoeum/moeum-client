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
 * PWA 홈화면 설치 안내 모달.
 * Android(Chrome): beforeinstallprompt 를 우리 트리거로 재사용.
 * iOS(Safari): 이벤트가 없어 수동 스텝 시각화(홈화면 설치 후에만 웹 푸시 동작 — iOS 16.4+).
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
        background: 'rgba(17, 24, 39, 0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
        WebkitTapHighlightColor: 'transparent',
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
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: '10px 24px max(20px, env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          animation: 'moeum-install-slideup 0.24s ease',
          ...swipe.style,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 40,
            height: 4,
            background: '#E5E8EB',
            borderRadius: 2,
            margin: '0 auto 2px',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
          <img src="/moeum-favicon.svg" alt="" width={48} height={48} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
          <h2
            id="install-title"
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#191F28',
              lineHeight: 1.35,
            }}
          >
            홈 화면에 추가하기
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              lineHeight: 1.5,
              color: '#6B7684',
              letterSpacing: '-0.01em',
            }}
          >
            다음부턴 아이콘으로 한 번에 열어요.
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
            padding: '6px 0 2px',
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: '#8B95A1',
            letterSpacing: '-0.01em',
          }}
        >
          다음에
        </button>
      </div>
      <style>{`@keyframes moeum-install-slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  )
}

function IosSteps() {
  return (
    <ol
      style={{
        margin: 0,
        padding: '12px 14px',
        background: '#F9FAFB',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        listStyle: 'none',
      }}
    >
      <IosStep n={1}>
        하단 <ShareIcon /> <b>공유</b> 누르기
      </IosStep>
      <IosStep n={2}>
        <b>“홈 화면에 추가”</b> 선택
      </IosStep>
      <IosStep n={3}>
        우측 상단 <b>추가</b>
      </IosStep>
    </ol>
  )
}

function IosStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <span
        style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: '#8B5CF6',
          color: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
        }}
        aria-hidden
      >
        {n}
      </span>
      <span
        style={{
          fontSize: 13.5,
          lineHeight: 1.45,
          color: '#191F28',
          letterSpacing: '-0.01em',
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
        {busy ? '설정 중…' : '홈 화면에 추가'}
      </Button>
    )
  }
  return (
    <div
      style={{
        padding: '12px 14px',
        background: '#F9FAFB',
        borderRadius: 12,
        fontSize: 13,
        lineHeight: 1.5,
        color: '#4E5968',
        letterSpacing: '-0.01em',
        wordBreak: 'keep-all',
      }}
    >
      브라우저 메뉴(<b>⋮</b>)에서 <b style={{ color: '#191F28' }}>홈 화면에 추가</b>를 선택하세요.
    </div>
  )
}

function ShareIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8B5CF6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: 'middle', display: 'inline-block' }}
      aria-hidden
    >
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

export type { Platform }