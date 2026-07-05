import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import Button from '@/components/ui/Button'

/**
 * Plaid 동의 화면 (프론트 mock UI, 서버 호출 없음).
 * 마이데이터 동의 화면(MyDataConsentPage)의 외국인 미러 — Plaid 표준 톤(Data Provider·
 * Collected·Purpose·Retention) 반영. 번역은 로케일 키(plaid.consent.*) 로 관리해
 * 사용자 언어에 맞춰 노출된다.
 */
export default function PlaidConsentPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const accessToken = useAuthStore((s) => s.accessToken)

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  const items = [
    { label: t('plaid.consent.provider'), value: t('plaid.consent.providerValue') },
    { label: t('plaid.consent.collected'), value: t('plaid.consent.collectedValue') },
    { label: t('plaid.consent.purpose'), value: t('plaid.consent.purposeValue') },
    { label: t('plaid.consent.retention'), value: t('plaid.consent.retentionValue') },
  ]

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
            {t('plaid.consent.title')}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.5,
              color: '#6b7684',
              letterSpacing: '-0.01em',
              whiteSpace: 'pre-line',
            }}
          >
            {t('plaid.consent.description')}
          </p>
        </header>

        <section style={{ display: 'flex', flexDirection: 'column' }}>
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
        <Button variant="solid" onClick={() => navigate('/plaid/accounts')}>
          {t('plaid.consent.cta')}
        </Button>
      </footer>
    </main>
  )
}
