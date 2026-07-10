import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { toErrorMessage } from '@/api/client'
import { useSignup } from '@/hooks/auth'
import PinScreen from '@/components/auth/PinScreen'

interface NavState {
  identityVerificationId: string
  name: string
}

/**
 * 가입 마무리 — 본인인증 직후 6자리 간편 비밀번호(PIN) 설정.
 * 오입력 방지를 위해 같은 PIN 을 두 번 입력받아 확인한다. 6자리 입력 시 자동 진행.
 */
export default function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { mutate: signup, isPending, error } = useSignup()
  const state = location.state as NavState | null
  /** 1차 입력값 — null 이면 아직 설정 단계 */
  const [firstPin, setFirstPin] = useState<string | null>(null)
  const [mismatch, setMismatch] = useState(false)

  // KYC 안 거치고 직접 진입한 경우 → 홈으로
  if (!state?.identityVerificationId) {
    return <Navigate to="/" replace />
  }

  const confirming = firstPin !== null

  const handleComplete = (pin: string) => {
    if (!confirming) {
      setMismatch(false)
      setFirstPin(pin)
      return
    }
    if (pin !== firstPin) {
      // 불일치 — 처음부터 다시 설정
      setFirstPin(null)
      setMismatch(true)
      return
    }
    signup(
      { identityVerificationId: state.identityVerificationId, pin },
      { onSuccess: () => navigate('/mydata/consent', { replace: true }) },
    )
  }

  return (
    <PinScreen
      key={confirming ? 'confirm' : 'set'}
      onBack={() => (confirming ? setFirstPin(null) : navigate(-1))}
      title={confirming ? '비밀번호 확인' : '비밀번호 설정'}
      desc={
        confirming
          ? '한 번 더 입력해주세요.'
          : `${state.name}님, 로그인에 사용할\n6자리 비밀번호를 입력해주세요.`
      }
      errorMessage={
        error ? toErrorMessage(error) : mismatch ? '비밀번호가 일치하지 않아요. 다시 설정해주세요.' : null
      }
      pending={isPending}
      pendingLabel="가입하는 중…"
      onComplete={handleComplete}
    />
  )
}
