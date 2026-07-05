import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import Button from '@/components/ui/Button'

/**
 * 마이데이터 동의 화면 (프론트 mock UI).
 * Toss In-app Design System 톤 — 타이포·간격·뉴트럴 컬러.
 * 색은 모음 디자인 토큰(cyan→purple) 그대로 유지.
 */
export default function MyDataConsentPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const userType = useAuthStore((s) => s.userType)

  if (!accessToken) {
    return <Navigate to="/" replace />
  }
  // 외국인은 MyData 대신 Plaid 흐름을 사용.
  if (userType === 'FOREIGN') {
    return <Navigate to="/plaid/consent" replace />
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#ffffff',
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
          padding: '40px 24px 120px',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              color: '#191f28',
            }}
          >
            보유 계좌를 한 번에
            <br />
            불러옵니다
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.5,
              color: '#6b7684',
              letterSpacing: '-0.01em',
            }}
          >
            마이데이터를 통해 본인 명의 계좌 정보를
            <br />
            안전하게 조회합니다
          </p>
        </header>

        <ConsentList />
      </div>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          background: '#ffffff',
          padding: '12px 24px max(24px, env(safe-area-inset-bottom))',
          maxWidth: 480,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Button variant="solid" onClick={() => navigate('/mydata/accounts')}>
          동의하고 계좌 불러오기
        </Button>
      </footer>
    </main>
  )
}

function ConsentList() {
  const items = [
    { label: '정보 제공 기관', value: '본인 명의 계좌가 있는 모든 은행' },
    { label: '수집 항목', value: '계좌번호 · 상품명 · 계좌상태 · 잔액' },
    { label: '이용 목적', value: '예금 토큰 충전·환불 계좌 등록' },
    { label: '보유 기간', value: '예금 토큰 충전 계좌 등록 완료 시까지' },
  ]
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: '16px 0',
            borderTop: i === 0 ? 'none' : '1px solid #f2f4f6',
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: '#8b95a1',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            {it.label}
          </span>
          <span
            style={{
              fontSize: 15,
              color: '#191f28',
              letterSpacing: '-0.01em',
            }}
          >
            {it.value}
          </span>
        </div>
      ))}
    </section>
  )
}