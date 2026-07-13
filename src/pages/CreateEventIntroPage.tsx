import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import Button from '@/components/ui/Button'

const STEPS = [
  { title: '기본 정보 입력', desc: '이벤트 이름, 설명을 입력합니다.' },
  { title: '상세 정보 입력', desc: '이벤트 목표 금액을 입력합니다.' },
  { title: '이벤트 장소 선택', desc: '이벤트가 열릴 장소를 선택합니다.' },
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
    <main style={{ minHeight: '100dvh', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
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
              color: '#1c1d1f',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={26} />
          </button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1c1d1f', letterSpacing: '-0.02em' }}>
            이벤트 생성
          </h1>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '28px 0 0' }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: '#5c5c72', letterSpacing: '-0.02em' }}>00</span>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 600,
              color: '#1c1d1f',
              letterSpacing: '-0.02em',
              lineHeight: 1.5,
            }}
          >
            새로운 이벤트를
            <br />
            생성해보세요
          </h2>
        </div>

        {/* 개설 진행 단계 — 보라 점 + 연결선 타임라인 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '48px 0 0' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#5c5c72', letterSpacing: '-0.02em' }}>
            개설 진행 단계
          </span>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
            {STEPS.map((step, i) => (
              <li key={step.title} style={{ display: 'flex', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#665bf7',
                      flexShrink: 0,
                    }}
                  />
                  {i < STEPS.length - 1 && (
                    <span aria-hidden style={{ flex: 1, minHeight: 56, width: 2, background: '#e6e1f9', margin: '8px 0' }} />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 32 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#1c1d1f', letterSpacing: '-0.02em' }}>
                    {step.title}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#5c5c72', letterSpacing: '-0.02em' }}>
                    {step.desc}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div style={{ flex: 1 }} />

        {/* 하단 바 — 흰색 라운드 카드 위 분기 버튼 */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            display: 'flex',
            gap: 12,
            background: '#fff',
            borderRadius: '32px 32px 0 0',
            margin: '0 -20px',
            padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
            boxShadow: '0 0 8px rgba(21,21,21,0.04)',
          }}
        >
          <Button variant="ghost" onClick={() => navigate('/events/new/ai')} style={{ borderRadius: 32 }}>
            AI 코칭 받기
          </Button>
          <Button variant="primary" onClick={() => navigate('/events/new/manual')} style={{ borderRadius: 32 }}>
            직접 생성하기
          </Button>
        </div>
      </div>
    </main>
  )
}
