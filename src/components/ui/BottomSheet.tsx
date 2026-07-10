import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * 공용 바텀시트 — 딤 오버레이 + 하단 슬라이드업 카드.
 * 스타일·애니메이션은 AccountSelectSheet(지갑 계좌 선택)와 동일 패턴.
 * 오버레이 탭/X 버튼으로 닫는다.
 */
export default function BottomSheet({ open, title, onClose, children }: Props) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(17, 24, 39, 0.48)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
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
          borderRadius: '32px 32px 0 0',
          padding: '34px 20px max(20px, env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          animation: 'moeum-sheet-slideup 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 500, color: '#151519', letterSpacing: '-0.02em' }}>
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              all: 'unset',
              display: 'flex',
              cursor: 'pointer',
              color: '#5c5c72',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
