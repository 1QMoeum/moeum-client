import { useState } from 'react'
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
 */
export default function EnableNotificationModal({ open, onDismiss, onGranted }: Props) {
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
          padding: '12px 24px max(20px, env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          animation: 'moeum-slideup 0.24s ease',
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
            margin: '0 auto 4px',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src="/moeum-favicon.svg" alt="" width={56} height={56} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
          <h2
            id="notif-priming-title"
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#191f28',
              lineHeight: 1.35,
            }}
          >
            알림을 허용해 주세요
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              lineHeight: 1.5,
              color: '#6b7684',
              letterSpacing: '-0.01em',
            }}
          >
            허용하면 모음의 중요한 소식을
            <br />
            푸시 알림으로 받아볼 수 있어요.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button variant="solid" onClick={handleAllow} disabled={pending}>
            {pending ? '설정 중…' : '허용하기'}
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            style={{
              all: 'unset',
              width: '100%',
              padding: '12px 0',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              color: '#8b95a1',
              letterSpacing: '-0.01em',
            }}
          >
            나중에
          </button>
        </div>
      </div>
      <style>{`@keyframes moeum-slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  )
}