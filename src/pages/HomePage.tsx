import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import MoeumLogo from '@/components/ui/MoeumLogo'
import Button from '@/components/ui/Button'

/**
 * 시작 화면 (스캐폴드). 디자인 시안 들어오면 갈아낄 자리.
 * - 자동 로그인 정보(refresh) 있으면 → 간편 로그인 화면
 * - 없으면 → KYC 인증 화면
 */
export default function HomePage() {
  const navigate = useNavigate()
  const hasRefresh = useAuthStore((s) => !!s.refreshToken)

  return (
    <main
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '0 24px 48px',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 중앙 — 로고 + 설명 */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <MoeumLogo height={44} />
        <p
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 17,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            maxWidth: 320,
            wordBreak: 'keep-all',
          }}
        >
          투명한 공동자금 관리를 위한
          <br />
          디지털 시금고
        </p>
      </section>

      {/* 하단 CTA */}
      <Button onClick={() => navigate(hasRefresh ? '/login' : '/kyc')}>
        {hasRefresh ? '간편 로그인' : '시작하기'}
      </Button>
    </main>
  )
}
