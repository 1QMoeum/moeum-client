import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toErrorMessage } from '@/api/client'
import { ErrorCode } from '@/constants/errorCodes'
import { useLogin } from '@/hooks/auth'
import { useAuthStore } from '@/store/auth'
import PinScreen from '@/components/auth/PinScreen'

/**
 * 간편 로그인 — refresh + PIN. 평상시 경로. 6자리 입력 시 자동 로그인.
 * refresh 만료(REFRESH_INVALID) 또는 PIN 분실 시 사용자 유형에 맞는 KYC 경로로 재진입.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const userType = useAuthStore((s) => s.userType)
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded)
  const clearTokens = useAuthStore((s) => s.clearTokens)

  const { mutate: login, isPending, error } = useLogin()

  const kycPath = userType === 'FOREIGN' ? '/kyc/foreign' : '/kyc'

  // 저장된 refresh 가 없으면 KYC 부터
  if (!refreshToken) {
    return <Navigate to={kycPath} replace />
  }

  const restartWithKyc = () => {
    clearTokens()
    navigate(kycPath, { replace: true })
  }

  const handleComplete = (pin: string) => {
    login(
      { refreshToken, pin },
      {
        // 온보딩은 첫 로그인에만 — 이미 본 디바이스는 바로 메인으로
        onSuccess: () => navigate(hasOnboarded ? '/main' : '/onboarding', { replace: true }),
        onError: (e) => {
          // refresh 만료/위조면 KYC 부터 다시 (사용자 유형에 맞는 경로로)
          if (e.status === ErrorCode.REFRESH_INVALID) {
            restartWithKyc()
          }
        },
      },
    )
  }

  return (
    <PinScreen
      headline={t('login.headline')}
      title={t('login.title')}
      errorMessage={error ? toErrorMessage(error) : null}
      pending={isPending}
      pendingLabel={t('login.submitting')}
      onComplete={handleComplete}
      bottomAction={
        <button
          type="button"
          onClick={restartWithKyc}
          style={{
            all: 'unset',
            padding: '6px 12px',
            fontSize: 16,
            fontWeight: 500,
            color: '#665bf7',
            letterSpacing: '-0.02em',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('login.forgotPin')}
        </button>
      }
    />
  )
}
