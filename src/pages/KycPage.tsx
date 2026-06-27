import { useNavigate } from 'react-router-dom'
import { toErrorMessage } from '@/api/client'
import { useVerifyKyc } from '@/hooks/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'

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
        금융인증서 또는 PASS 로 본인인증을 진행합니다.
      </p>

      {error && (
        <div
          style={{
            padding: 12,
            background: '#fef2f2',
            color: '#b91c1c',
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {toErrorMessage(error)}
        </div>
      )}

      <Button onClick={handleStart} disabled={isPending}>
        {isPending ? '진행 중…' : '본인인증 시작'}
      </Button>
    </Screen>
  )
}
