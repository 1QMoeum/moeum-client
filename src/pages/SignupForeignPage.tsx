import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toErrorMessage } from '@/api/client'
import { useSignupForeign } from '@/hooks/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'
import ErrorBanner from '@/components/ui/ErrorBanner'
import PinInput from '@/components/auth/PinInput'

interface NavState {
  passport: File
  selfie: File
  name: string
}

/**
 * 외국인 회원가입 — 여권 + 셀피 + PIN. KYC 안 거치고 직접 진입하면 홈으로 돌려보낸다.
 */
export default function SignupForeignPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { mutate: signup, isPending, error } = useSignupForeign()
  const state = location.state as NavState | null
  const [pin, setPin] = useState('')

  if (!state?.passport || !state?.selfie) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = () => {
    if (pin.length !== 6) return
    signup(
      { passport: state.passport, selfie: state.selfie, pin },
      { onSuccess: () => navigate('/', { replace: true }) },
    )
  }

  return (
    <Screen>
      <h1 style={{ margin: 0, fontSize: 24 }}>
        {t('signupForeign.title', { name: state.name })}
      </h1>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
        {t('signupForeign.subtitle')}
      </p>

      <PinInput value={pin} onChange={setPin} disabled={isPending} />

      {error && <ErrorBanner message={toErrorMessage(error)} />}

      <Button variant="solid" onClick={handleSubmit} disabled={isPending || pin.length !== 6}>
        {isPending ? t('signupForeign.submitting') : t('signupForeign.submit')}
      </Button>
    </Screen>
  )
}