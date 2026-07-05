import type { CSSProperties } from 'react'
import MoeumLogo from '@/components/ui/MoeumLogo'

/**
 * 앱 시작화면(스플래시). 세션 복원 등 초기 준비가 끝나기 전 잠깐 노출된다.
 * manifest 의 background_color(흰색)와 같은 배경이라 PWA 네이티브 스플래시와
 * 이음새 없이 이어진다. AuthBootstrap 이 준비 전 이 화면을 렌더한다.
 */
export default function SplashScreen() {
  return (
    <div role="status" aria-label="로딩 중" style={containerStyle}>
      {/* 로고 뒤 은은한 보라 글로우 — 흰 배경에 브랜드감만 살짝 */}
      <div aria-hidden style={glowStyle} />
      <div style={contentStyle}>
        <MoeumLogo height={40} />
        <div className="moeum-splash-spinner" />
      </div>
    </div>
  )
}

const containerStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-surface)',
  overflow: 'hidden',
}

const glowStyle: CSSProperties = {
  position: 'absolute',
  width: 320,
  height: 320,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(124,111,240,0.14) 0%, rgba(124,111,240,0) 70%)',
  pointerEvents: 'none',
}

const contentStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 28,
  animation: 'moeum-splash-in 0.4s ease both',
}
