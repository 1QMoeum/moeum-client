import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import OnboardingLayout from '@/components/onboarding/OnboardingLayout'
import StepHeader from '@/components/onboarding/StepHeader'
import CtaButton from '@/components/onboarding/CtaButton'

const CONSENT_ITEMS = [
  { label: '정보 제공 기관', value: '본인 명의 계좌가 있는 모든 은행' },
  { label: '수집 항목', value: '계좌번호・상품명・계좌상태・은행' },
  { label: '이용 목적', value: '예금 토큰 충전・환불 계좌 등록' },
  { label: '보유 기간', value: '예금 토큰 충전 계좌 등록 완료 시까지' },
]

/**
 * 온보딩 01 — 마이데이터 동의 화면 (프론트 mock UI).
 * 마이데이터는 국내 전용 플로우라 문구는 한국어 고정.
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
    <OnboardingLayout
      title="계좌 연동하기"
      onBack={() => navigate(-1)}
      footer={<CtaButton label="다음" onClick={() => navigate('/mydata/accounts')} />}
    >
      <StepHeader
        step="01"
        title={'보유 계좌를 한 번에\n불러올게요'}
        desc={'마이데이터를 통해 본인 명의 계좌 정보를\n안전하게 조회해요'}
      />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {CONSENT_ITEMS.map((it) => (
          <div key={it.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em', color: '#5c5c72' }}
            >
              {it.label}
            </span>
            <span
              style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em', color: '#151519' }}
            >
              {it.value}
            </span>
          </div>
        ))}
      </section>
    </OnboardingLayout>
  )
}
