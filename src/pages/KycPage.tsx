import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { authApi } from '@/api/auth'
import { requestKgInicisIdentityVerification } from '@/lib/portone'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    setError(null)
    setLoading(true)
    try {
      const identityVerificationId = await requestKgInicisIdentityVerification()
      const verifyResult = await authApi.verifyKyc(identityVerificationId)

      const navState = { identityVerificationId, name: verifyResult.name }
      if (verifyResult.newUser) {
        navigate('/signup', { state: navState })
      } else {
        navigate('/kyc-login', { state: navState })
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`${e.message} (${e.status})`)
      } else if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('알 수 없는 오류가 발생했습니다.')
      }
      setLoading(false)
    }
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
          {error}
        </div>
      )}

      <Button onClick={handleStart} disabled={loading}>
        {loading ? '진행 중…' : '본인인증 시작'}
      </Button>
    </Screen>
  )
}
