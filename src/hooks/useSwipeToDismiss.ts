import { useCallback, useRef, useState } from 'react'
import type { TouchEvent } from 'react'

interface Options {
  onDismiss: () => void
  /** 아래로 이 px 이상 내리면 dismiss. 기본 100. */
  threshold?: number
  /** 이 속도(px/ms) 이상으로 아래로 flick 하면 threshold 이하여도 dismiss. 기본 0.5. */
  velocityThreshold?: number
}

/**
 * 바텀시트 스와이프 다운 → dismiss.
 * <p>사용: {@code <div {...handlers} style={style} />}
 * <p>스크롤 컨테이너 상단(scrollTop === 0)에서 아래로 시작한 제스처만 드래그로 인식해
 * 콘텐츠 스크롤과 충돌을 피한다.
 */
export function useSwipeToDismiss({
  onDismiss,
  threshold = 100,
  velocityThreshold = 0.5,
}: Options) {
  const [translateY, setTranslateY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef<number | null>(null)
  const startTime = useRef<number>(0)
  const lastY = useRef<number>(0)
  const lastTime = useRef<number>(0)

  const onTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (target.scrollTop > 0) return
    startY.current = e.touches[0].clientY
    lastY.current = startY.current
    startTime.current = Date.now()
    lastTime.current = startTime.current
    setDragging(true)
  }, [])

  const onTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (startY.current === null) return
    const y = e.touches[0].clientY
    const dy = y - startY.current
    if (dy < 0) {
      setTranslateY(0)
      return
    }
    lastY.current = y
    lastTime.current = Date.now()
    setTranslateY(dy)
  }, [])

  const onTouchEnd = useCallback(() => {
    if (startY.current === null) return
    const dy = lastY.current - startY.current
    const dt = Math.max(1, lastTime.current - startTime.current)
    const velocity = dy / dt
    const shouldDismiss = dy > threshold || velocity > velocityThreshold
    setDragging(false)
    setTranslateY(0)
    startY.current = null
    if (shouldDismiss) onDismiss()
  }, [onDismiss, threshold, velocityThreshold])

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
    },
    style: {
      transform: `translateY(${translateY}px)`,
      transition: dragging ? 'none' : 'transform 0.24s cubic-bezier(0.32, 0.72, 0, 1)',
      touchAction: 'pan-y' as const,
    },
  }
}
