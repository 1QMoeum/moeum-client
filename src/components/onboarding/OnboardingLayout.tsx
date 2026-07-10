import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

interface Props {
  /** 탑바 타이틀 (예: "계좌 연동하기") */
  title: string
  /** 뒤로가기 핸들러. 없으면 캐럿을 숨긴다. */
  onBack?: () => void
  /** 하단 고정 패널(흰색·상단 라운드)에 들어갈 CTA 버튼(들) */
  footer: ReactNode
  children: ReactNode
}

/**
 * 온보딩(계좌 연동) 플로우 공용 레이아웃.
 * Figma 디자인: #fafafa 배경 + 탑바(캐럿·타이틀) + 상단 라운드 32px 흰색 하단 패널.
 */
export default function OnboardingLayout({ title, onBack, footer, children }: Props) {
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
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 56,
            padding: '0 20px',
            boxSizing: 'border-box',
          }}
        >
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
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#27282c',
            }}
          >
            {title}
          </h1>
        </header>

        <div
          style={{
            flex: 1,
            padding: '30px 20px 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
          }}
        >
          {children}
        </div>
      </div>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          background: '#ffffff',
          borderRadius: '32px 32px 0 0',
          boxShadow: '0 0 16px rgba(21,21,21,0.04)',
          padding: '20px 20px max(20px, env(safe-area-inset-bottom))',
          maxWidth: 480,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {footer}
      </footer>
    </main>
  )
}
