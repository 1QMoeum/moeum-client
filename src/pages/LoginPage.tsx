import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toErrorMessage } from '@/api/client'
import { ErrorCode } from '@/constants/errorCodes'
import { useLogin } from '@/hooks/auth'
import { useAuthStore } from '@/store/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'
import ErrorBanner from '@/components/ui/ErrorBanner'
import PinInput from '@/components/auth/PinInput'

/** 간편 로그인 — refresh + PIN. 평상시 경로. */
export default function LoginPage() {
  const navigate = useNavigate()
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const clearTokens = useAuthStore((s) => s.clearTokens)

  const { mutate: login, isPending, error } = useLogin()
  const [pin, setPin] = useState('')

  // 저장된 refresh 가 없으면 KYC 부터
  if (!refreshToken) {
    return <Navigate to="/kyc" replace />
  }

  const handleSubmit = () => {
    if (pin.length !== 6) return
    login(
      { refreshToken, pin },
      {
        onSuccess: () => navigate('/done', { replace: true }),
        onError: (e) => {
          // refresh 만료/위조면 KYC 부터 다시
          if (e.status === ErrorCode.REFRESH_INVALID) {
            clearTokens()
            navigate('/kyc', { replace: true })
          }
        },
      },
    )
  }

  return (
    <Screen>
      <h1 style={{ margin: 0, fontSize: 24 }}>PIN을 입력해주세요</h1>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
        가입할 때 설정한 6자리 PIN입니다.
      </p>

      <PinInput value={pin} onChange={setPin} disabled={isPending} />

      {error && <ErrorBanner message={toErrorMessage(error)} />}

      <Button onClick={handleSubmit} disabled={isPending || pin.length !== 6}>
        {isPending ? '로그인 중…' : '로그인'}
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
