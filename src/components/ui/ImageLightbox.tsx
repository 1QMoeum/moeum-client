import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

/**
 * 전체 화면 이미지 뷰어(라이트박스). 갤러리 이미지 탭 → 확대 보기.
 * 배경 탭·X·Escape 로 닫고, 여러 장이면 좌우 화살표로 넘긴다.
 */
export default function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: string[]
  index: number
  onClose: () => void
  onIndexChange: (next: number) => void
}) {
  // Escape 닫기 + 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1)
      if (e.key === 'ArrowRight' && index < images.length - 1) onIndexChange(index + 1)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [index, images.length, onClose, onIndexChange])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 확대 보기"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(10, 10, 12, 0.94)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={images[index]}
        alt={`${index + 1}번째 이미지`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '100vw',
          maxHeight: '100dvh',
          objectFit: 'contain',
          display: 'block',
          userSelect: 'none',
        }}
      />

      <button type="button" aria-label="닫기" onClick={onClose} style={{ ...ctrlStyle, top: 'calc(16px + env(safe-area-inset-top))', right: 16 }}>
        <X size={22} strokeWidth={2.2} />
      </button>

      {images.length > 1 && (
        <>
          {index > 0 && (
            <button
              type="button"
              aria-label="이전 이미지"
              onClick={(e) => {
                e.stopPropagation()
                onIndexChange(index - 1)
              }}
              style={{ ...ctrlStyle, left: 12, top: '50%', transform: 'translateY(-50%)' }}
            >
              <ChevronLeft size={24} strokeWidth={2.2} />
            </button>
          )}
          {index < images.length - 1 && (
            <button
              type="button"
              aria-label="다음 이미지"
              onClick={(e) => {
                e.stopPropagation()
                onIndexChange(index + 1)
              }}
              style={{ ...ctrlStyle, right: 12, top: '50%', transform: 'translateY(-50%)' }}
            >
              <ChevronRight size={24} strokeWidth={2.2} />
            </button>
          )}
          <span
            style={{
              position: 'absolute',
              bottom: 'calc(20px + env(safe-area-inset-bottom))',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {index + 1} / {images.length}
          </span>
        </>
      )}
    </div>
  )
}

const ctrlStyle = {
  position: 'absolute',
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
} as const
