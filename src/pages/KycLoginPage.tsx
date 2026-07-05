import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toErrorMessage } from '@/api/client'
import { useKycLogin } from '@/hooks/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'
import ErrorBanner from '@/components/ui/ErrorBanner'
import PinInput from '@/components/auth/PinInput'

interface NavState {
  identityVerificationId: string
  name: string
}

/** 재인증 로그인 — KYC 거친 후 PIN. 자동 로그인 만료된 경우. */
export default function KycLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { mutate: kycLogin, isPending, error } = useKycLogin()
  const state = location.state as NavState | null
  const [pin, setPin] = useState('')

  if (!state?.identityVerificationId) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = () => {
    if (pin.length !== 6) return
    kycLogin(
      { identityVerificationId: state.identityVerificationId, pin },
      { onSuccess: () => navigate('/onboarding', { replace: true }) },
    )
  }

  return (
    <Screen>
      <h1 style={{ margin: 0, fontSize: 24 }}>
        {state.name}님, PIN을 입력해주세요
      </h1>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
        가입할 때 설정한 6자리 PIN입니다.
      </p>

      <PinInput value={pin} onChange={setPin} disabled={isPending} />

      {error && <ErrorBanner message={toErrorMessage(error)} />}

      <Button onClick={handleSubmit} disabled={isPending || pin.length !== 6}>
        {isPending ? '로그인 중…' : '로그인'}
      </Button>
    </Screen>
  )
}
