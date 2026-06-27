import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'
import PinInput from '@/components/auth/PinInput'

interface NavState {
  identityVerificationId: string
  name: string
}

/** 재인증 로그인 — KYC 거친 후 PIN. 자동 로그인 만료된 경우. */
export default function KycLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setTokens = useAuthStore((s) => s.setTokens)

  const state = location.state as NavState | null
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!state?.identityVerificationId) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async () => {
    if (pin.length !== 6) return
    setError(null)
    setLoading(true)
    try {
      const tokens = await authApi.kycLogin(state.identityVerificationId, pin)
      setTokens(tokens.accessToken, tokens.refreshToken)
      navigate('/done', { replace: true })
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`${e.message} (${e.status})`)
      } else if (e instanceof Error) {
        setError(e.message)
      }
      setLoading(false)
    }
  }

  return (
    <Screen>
      <h1 style={{ margin: 0, fontSize: 24 }}>
        {state.name}님, PIN을 입력해주세요
      </h1>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
        가입할 때 설정한 6자리 PIN입니다.
      </p>

      <PinInput value={pin} onChange={setPin} disabled={loading} />

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

      <Button onClick={handleSubmit} disabled={loading || pin.length !== 6}>
        {loading ? '로그인 중…' : '로그인'}
      </Button>
    </Screen>
  )
}
