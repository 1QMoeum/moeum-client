import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toErrorMessage } from '@/api/client'
import { ErrorCode } from '@/constants/errorCodes'
import { useLogin } from '@/hooks/auth'
import { useAuthStore } from '@/store/auth'
import Screen from '@/components/ui/Screen'
import Button from '@/components/ui/Button'
import ErrorBanner from '@/components/ui/ErrorBanner'
import PinInput from '@/components/auth/PinInput'

/**
 * 간편 로그인 — refresh + PIN. 평상시 경로.
 * refresh 만료(REFRESH_INVALID) 또는 PIN 분실 시 사용자 유형에 맞는 KYC 경로로 재진입.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const userType = useAuthStore((s) => s.userType)
  const clearTokens = useAuthStore((s) => s.clearTokens)

  const { mutate: login, isPending, error } = useLogin()
  const [pin, setPin] = useState('')

  const kycPath = userType === 'FOREIGN' ? '/kyc/foreign' : '/kyc'

  // 저장된 refresh 가 없으면 KYC 부터
  if (!refreshToken) {
    return <Navigate to={kycPath} replace />
  }

  const handleSubmit = () => {
    if (pin.length !== 6) return
    login(
      { refreshToken, pin },
      {
        onSuccess: () => navigate('/onboarding', { replace: true }),
        onError: (e) => {
          // refresh 만료/위조면 KYC 부터 다시 (사용자 유형에 맞는 경로로)
          if (e.status === ErrorCode.REFRESH_INVALID) {
            clearTokens()
            navigate(kycPath, { replace: true })
          }
        },
      },
    )
  }

  return (
    <Screen>
      <h1 style={{ margin: 0, fontSize: 24 }}>{t('login.title')}</h1>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{t('login.subtitle')}</p>

      <PinInput value={pin} onChange={setPin} disabled={isPending} />

      {error && <ErrorBanner message={toErrorMessage(error)} />}

      <Button onClick={handleSubmit} disabled={isPending || pin.length !== 6}>
        {isPending ? t('login.submitting') : t('login.submit')}
      </Button>

      <button
        type="button"
        onClick={() => {
          clearTokens()
          navigate(kycPath, { replace: true })
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
        {t('login.forgotPin')}
      </button>
    </Screen>
  )
}
