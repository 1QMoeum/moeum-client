import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toErrorMessage } from '@/api/client'
import { useSignupForeign } from '@/hooks/auth'
import PinScreen from '@/components/auth/PinScreen'

interface NavState {
  passport: File
  selfie: File
  name: string
}

/**
 * 외국인 회원가입 — 여권 + 셀피 + PIN. KYC 안 거치고 직접 진입하면 홈으로 돌려보낸다.
 * 오입력 방지를 위해 같은 PIN 을 두 번 입력받아 확인한다. 6자리 입력 시 자동 진행.
 */
export default function SignupForeignPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { mutate: signup, isPending, error } = useSignupForeign()
  const state = location.state as NavState | null
  /** 1차 입력값 — null 이면 아직 설정 단계 */
  const [firstPin, setFirstPin] = useState<string | null>(null)
  const [mismatch, setMismatch] = useState(false)

  if (!state?.passport || !state?.selfie) {
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
      setFirstPin(null)
      setMismatch(true)
      return
    }
    signup(
      { passport: state.passport, selfie: state.selfie, pin },
      { onSuccess: () => navigate('/', { replace: true }) },
    )
  }

  return (
    <PinScreen
      key={confirming ? 'confirm' : 'set'}
      onBack={() => (confirming ? setFirstPin(null) : navigate(-1))}
      title={confirming ? t('signupForeign.confirmTitle') : t('signupForeign.title', { name: state.name })}
      desc={confirming ? undefined : t('signupForeign.subtitle')}
      errorMessage={error ? toErrorMessage(error) : mismatch ? t('signupForeign.mismatch') : null}
      pending={isPending}
      pendingLabel={t('signupForeign.submitting')}
      onComplete={handleComplete}
    />
  )
}
