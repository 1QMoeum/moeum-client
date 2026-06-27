import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { toErrorMessage } from '@/api/client'
import { useSignup } from '@/hooks/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'
import PinInput from '@/components/auth/PinInput'

interface NavState {
  identityVerificationId: string
  name: string
}

export default function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { mutate: signup, isPending, error } = useSignup()
  const state = location.state as NavState | null
  const [pin, setPin] = useState('')

  // KYC 안 거치고 직접 진입한 경우 → 홈으로
  if (!state?.identityVerificationId) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = () => {
    if (pin.length !== 6) return
    signup(
      { identityVerificationId: state.identityVerificationId, pin },
      { onSuccess: () => navigate('/done', { replace: true }) },
    )
  }

  return (
    <Screen>
      <h1 style={{ margin: 0, fontSize: 24 }}>
        {state.name}님, 6자리 PIN을 설정해주세요
      </h1>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
        다음 로그인부터 이 PIN으로 빠르게 들어올 수 있어요.
      </p>

      <PinInput value={pin} onChange={setPin} disabled={isPending} />

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

      <Button onClick={handleSubmit} disabled={isPending || pin.length !== 6}>
        {isPending ? '가입 중…' : '가입 완료'}
      </Button>
    </Screen>
  )
}
