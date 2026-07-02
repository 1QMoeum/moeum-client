import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const STEPS = [
  { title: '기본 정보 입력', desc: '이벤트 이름, 설명, 모금 기간을 입력합니다' },
  { title: '상세 정보 입력', desc: '목표 예산과 사용 계획을 설정합니다' },
  { title: '이벤트 장소 선택', desc: '지도에서 직접 고르거나 AI 추천 장소를 선택합니다' },
]

/**
 * 이벤트 생성 진입 화면 — 개설 단계 안내 + [AI 코칭 받기 | 직접 생성하기] 분기.
 * AI 코칭은 /events/new/ai (장소 추천 플래너), 직접 생성은 /events/new/manual (위저드).
 */
export default function CreateEventIntroPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

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
          <button
            type="button"
            onClick={() => navigate(-1)}
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#191f28', letterSpacing: '-0.02em' }}>
            이벤트 생성
          </h1>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '28px 4px 0' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#adb5bd', letterSpacing: '0.02em' }}>00</span>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#191f28',
              letterSpacing: '-0.02em',
              lineHeight: 1.35,
            }}
          >
            새로운 이벤트를
            <br />
            생성해보세요
          </h2>
        </div>

        {/* 개설 진행 단계 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '36px 4px 0' }}>
          <span style={{ fontSize: 13, color: '#8b95a1', letterSpacing: '-0.01em' }}>개설 진행 단계</span>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
            {STEPS.map((step, i) => (
              <li key={step.title} style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span
                    aria-hidden
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: '#e9e9ee',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#8b95a1',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      style={{ flex: 1, minHeight: 28, borderLeft: '2px dashed #e9e9ee', margin: '4px 0' }}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 20 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#191f28', letterSpacing: '-0.01em' }}>
                    {step.title}
                  </span>
                  <span style={{ fontSize: 13, color: '#8b95a1', letterSpacing: '-0.01em' }}>{step.desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div style={{ flex: 1 }} />

        {/* 분기 버튼 */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            display: 'flex',
            gap: 10,
            background: '#fff',
            padding: '12px 0 calc(20px + env(safe-area-inset-bottom))',
          }}
        >
          <IntroButton label="AI 코칭 받기" onClick={() => navigate('/events/new/ai')} />
          <IntroButton label="직접 생성하기" onClick={() => navigate('/events/new/manual')} emphasized />
        </div>
      </div>
    </main>
  )
}

function IntroButton({
  label,
  onClick,
  emphasized = false,
}: {
  label: string
  onClick: () => void
  emphasized?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        flex: 1,
        padding: '16px 0',
        borderRadius: 999,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        color: emphasized ? '#fff' : '#191f28',
        background: emphasized ? '#191f28' : '#f0f0f3',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}
