import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toErrorMessage } from '@/api/client'
import { useKycLogin } from '@/hooks/auth'
import { useAuthStore } from '@/store/auth'
import PinScreen from '@/components/auth/PinScreen'

interface NavState {
  identityVerificationId: string
  name: string
}

/** 재인증 로그인 — KYC 거친 후 PIN. 자동 로그인 만료된 경우. 6자리 입력 시 자동 로그인. */
export default function KycLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { mutate: kycLogin, isPending, error } = useKycLogin()
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded)
  const state = location.state as NavState | null

  if (!state?.identityVerificationId) {
    return <Navigate to="/" replace />
  }

  const handleComplete = (pin: string) => {
    kycLogin(
      { identityVerificationId: state.identityVerificationId, pin },
      // 온보딩은 첫 로그인에만 — 이미 본 디바이스는 바로 메인으로
      { onSuccess: () => navigate(hasOnboarded ? '/main' : '/onboarding', { replace: true }) },
    )
  }

  return (
    <PinScreen
      onBack={() => navigate(-1)}
      headline={`${state.name}님,\n다시 만나서 반가워요!`}
      title="비밀번호를 눌러주세요"
      errorMessage={error ? toErrorMessage(error) : null}
      pending={isPending}
      pendingLabel="로그인 중…"
      onComplete={handleComplete}
    />
  )
}
