import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import { useEnableNotifications } from '@/hooks/fcm'
import { useSwipeToDismiss } from '@/hooks/useSwipeToDismiss'

interface Props {
  open: boolean
  onDismiss: () => void
  onGranted?: () => void
}

/**
 * 알림 권한 priming 모달. 브라우저 프롬프트 직전에 왜 필요한지 먼저 설명해 opt-in 률을 높인다.
 * "허용하기" 클릭 시에만 requestPermission() 이 호출된다(업계 표준 permission priming).
 * 홈화면 추가 모달({@code InstallPromptModal})과 톤·구조 통일 — 아이콘 없이 텍스트만.
 */
export default function EnableNotificationModal({ open, onDismiss, onGranted }: Props) {
  const { t } = useTranslation()
  const enable = useEnableNotifications()
  const [pending, setPending] = useState(false)
  const swipe = useSwipeToDismiss({ onDismiss })

  if (!open) return null

  const handleAllow = async () => {
    setPending(true)
    const ok = await enable()
    setPending(false)
    if (ok) onGranted?.()
    onDismiss()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-priming-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.48)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
        WebkitTapHighlightColor: 'transparent',
        animation: 'moeum-notif-fade 0.2s ease',
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
          animation: 'moeum-notif-slideup 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
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
            id="notif-priming-title"
            style={{
              margin: 0,
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#191F28',
              lineHeight: 1.35,
            }}
          >
            {t('notif.title')}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 14.5,
              lineHeight: 1.55,
              color: '#4E5968',
              letterSpacing: '-0.015em',
              wordBreak: 'keep-all',
              whiteSpace: 'pre-line',
            }}
          >
            {t('notif.body')}
          </p>
        </div>

        <Button variant="solid" onClick={handleAllow} disabled={pending}>
          {pending ? t('notif.allowing') : t('notif.allow')}
        </Button>

        <button
          type="button"
          onClick={onDismiss}
          style={{
            all: 'unset',
            width: '100%',
            padding: '18px 0 4px',
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
            color: '#8B95A1',
            letterSpacing: '-0.015em',
          }}
        >
          {t('notif.later')}
        </button>
      </div>
      <style>{`
        @keyframes moeum-notif-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes moeum-notif-slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  )
}
