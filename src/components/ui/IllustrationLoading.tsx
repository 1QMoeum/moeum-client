import { ChevronLeft } from 'lucide-react'

interface Props {
  /** 탑바 타이틀 (예: "AI 플래너", "이벤트 생성") */
  topTitle: string
  /** 뒤로가기(취소) 핸들러. 없으면 캐럿을 숨긴다. */
  onBack?: () => void
  /** 여러 줄이면 \n 구분 */
  title: string
  desc?: string
}

/**
 * 일러스트 로딩 화면 — 피그마 930:5943 (플랜 생성 중).
 * 긴 서버 작업(플랜 추천, 이벤트 생성) 동안 빈 화면 대신 보여준다.
 */
export default function IllustrationLoading({ topTitle, onBack, title, desc }: Props) {
  return (
    <main style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '8px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 8 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="뒤로"
              style={{
                all: 'unset',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 12,
                cursor: 'pointer',
                color: '#191f28',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ChevronLeft size={26} />
            </button>
          )}
          <h1
            style={{
              margin: 0,
              padding: onBack ? 0 : '8px 4px',
              fontSize: 18,
              fontWeight: 600,
              color: '#191f28',
              letterSpacing: '-0.02em',
            }}
          >
            {topTitle}
          </h1>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '28px 4px 0' }}>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#191f28',
              letterSpacing: '-0.02em',
              lineHeight: 1.35,
              whiteSpace: 'pre-line',
            }}
          >
            {title}
          </h2>
          {desc && <span style={{ fontSize: 14, color: '#6b7684', letterSpacing: '-0.01em' }}>{desc}</span>}
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
          <img
            src="/ai-plan-loading.png"
            alt=""
            width={260}
            style={{ height: 'auto', animation: 'moeumIllustPulse 1.6s ease-in-out infinite' }}
          />
        </div>
        <style>{`@keyframes moeumIllustPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.85; } }`}</style>
      </div>
    </main>
  )
}
