import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'
import PinInput from '@/components/auth/PinInput'

/** 간편 로그인 — refresh + PIN. 평상시 경로. */
export default function LoginPage() {
  const navigate = useNavigate()
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setTokens = useAuthStore((s) => s.setTokens)
  const clearTokens = useAuthStore((s) => s.clearTokens)

  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 저장된 refresh 가 없으면 KYC 부터
  if (!refreshToken) {
    return <Navigate to="/kyc" replace />
  }

  const handleSubmit = async () => {
    if (pin.length !== 6) return
    setError(null)
    setLoading(true)
    try {
      const tokens = await authApi.login(refreshToken, pin)
      setTokens(tokens.accessToken, tokens.refreshToken)
      navigate('/done', { replace: true })
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`${e.message} (${e.status})`)
        // refresh 만료/위조면 KYC 부터 다시
        if (e.status === 2006) {
          clearTokens()
          navigate('/kyc', { replace: true })
          return
        }
      } else if (e instanceof Error) {
        setError(e.message)
      }
      setLoading(false)
    }
  }

  return (
    <Screen>
      <h1 style={{ margin: 0, fontSize: 24 }}>PIN을 입력해주세요</h1>
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

      <button
        type="button"
        onClick={() => {
          clearTokens()
          navigate('/kyc', { replace: true })
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-secondary)',
          fontSize: 14,
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
      >
        PIN을 잊으셨나요? 본인인증으로 다시 시작
      </button>
    </Screen>
  )
}
