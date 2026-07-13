import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  /** 진행률 0~100 */
  percent: number
  /** 링 지름(px) */
  size?: number
  /** 링 두께(px) */
  stroke?: number
  /**
   * 화면에 보이는 활성 상태인지. false → true 로 바뀔 때마다
   * 0에서 다시 차오른다 (캐러셀 슬라이드 전환용). 기본 true.
   */
  active?: boolean
  /** 링 내부에 들어갈 콘텐츠(이미지 등) */
  children?: ReactNode
}

/**
 * 원형 진행 링. 옅은 회색 트랙 위에 보라 액센트 호(arc)를 그린다.
 * 내부 영역(children)은 링 안쪽 원에 꽉 차도록 클립된다.
 */
export default function ProgressRing({ percent, size = 280, stroke = 8, active = true, children }: Props) {
  const clamped = Math.max(0, Math.min(100, percent))

  // active 가 될 때마다 0에서 목표치까지 차오르는 애니메이션.
  // 0% 프레임이 먼저 페인트돼야 transition이 동작하므로 rAF 두 번으로 프레임을 보장한다.
  const [progress, setProgress] = useState(0)
  const [animating, setAnimating] = useState(false)
  useEffect(() => {
    if (!active) {
      // 비활성 슬라이드는 transition 없이 즉시 0으로 리셋해 둔다.
      setAnimating(false)
      setProgress(0)
      return
    }
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        setAnimating(true)
        setProgress(clamped)
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [active, clamped])

  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (progress / 100) * circumference
  const center = size / 2
  const inner = size - stroke * 2 - 14

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`달성률 ${Math.round(clamped)}%`}
        style={{ display: 'block', transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: animating ? 'stroke-dasharray 1.2s cubic-bezier(0.22, 1, 0.36, 1)' : 'none' }}
        />
      </svg>

      {/* 내부 이미지/콘텐츠 — 링 안쪽에 원형으로 클립 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: inner,
          height: inner,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'var(--color-muted)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
