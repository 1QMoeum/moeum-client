import { useNavigate } from 'react-router-dom'
import { toErrorMessage } from '@/api/client'
import { useVerifyKyc } from '@/hooks/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'
import ErrorBanner from '@/components/ui/ErrorBanner'

/**
 * KYC 인증 트리거 화면.
 * 1) 포트원 SDK 호출 → identityVerificationId 받기
 * 2) 서버 /auth/kyc/domestic/verify → newUser 판별
 * 3) newUser=true → /signup, false → /kyc-login (state 로 id/name 전달)
 */
export default function KycPage() {
  const navigate = useNavigate()
  const { mutate: verifyKyc, isPending, error } = useVerifyKyc()

  const handleStart = () => {
    verifyKyc(undefined, {
      onSuccess: ({ identityVerificationId, result }) => {
        const navState = { identityVerificationId, name: result.name }
        navigate(result.newUser ? '/signup' : '/kyc-login', { state: navState })
      },
    })
  }

  return (
    <Screen>
      <h1 style={{ margin: 0, fontSize: 24 }}>본인인증</h1>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
        본인 명의 휴대폰으로 인증을 진행해요.
      </p>

      {error && <ErrorBanner message={toErrorMessage(error)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="solid" onClick={handleStart} disabled={isPending}>
          {isPending ? '진행 중…' : '본인인증 시작'}
        </Button>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: '#8b95a1',
            textAlign: 'center',
            letterSpacing: '-0.01em',
            lineHeight: 1.55,
          }}
        >
          카카오 인증은 지원하지 않아요 · 금융인증서 · PASS · 토스 이용
        </p>
      </div>
    </Screen>
  )
}
