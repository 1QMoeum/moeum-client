import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Smartphone, Clock3 } from 'lucide-react'
import type { ReactNode } from 'react'
import { toErrorMessage } from '@/api/client'
import { useVerifyKyc } from '@/hooks/auth'
import OnboardingLayout from '@/components/onboarding/OnboardingLayout'
import StepHeader from '@/components/onboarding/StepHeader'
import CtaButton from '@/components/onboarding/CtaButton'
import ErrorBanner from '@/components/ui/ErrorBanner'

const VIOLET = '#665bf7'

/**
 * KYC 인증 트리거 화면.
 * 1) 포트원 SDK 호출 → identityVerificationId 받기
 * 2) 서버 /auth/kyc/domestic/verify → newUser 판별
 * 3) newUser=true → /signup, false → /kyc-login (state 로 id/name 전달)
 */
export default function KycPage() {
  const navigate = useNavigate()
  const { mutate: verifyKyc, isPending, error } = useVerifyKyc()

  const handleStart = () => {
    verifyKyc(undefined, {
      onSuccess: ({ identityVerificationId, result }) => {
        const navState = { identityVerificationId, name: result.name }
        navigate(result.newUser ? '/signup' : '/kyc-login', { state: navState })
      },
    })
  }

  return (
    <OnboardingLayout
      title="본인인증"
      onBack={() => navigate(-1)}
      footer={
        <CtaButton
          label={isPending ? '인증 창 여는 중…' : '본인인증 시작하기'}
          onClick={handleStart}
          disabled={isPending}
        />
      }
    >
      <StepHeader
        title={'모음을 시작하려면\n본인 확인이 필요해요'}
        desc="본인 명의 휴대폰으로 한 번만 인증하면 돼요."
      />

      {error && <ErrorBanner message={toErrorMessage(error)} />}

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '8px 20px',
          boxShadow: '0 0 8px rgba(21,21,21,0.04)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <InfoRow icon={<ShieldCheck size={22} color={VIOLET} strokeWidth={2} />} title="안전한 인증">
          금융인증서 · PASS · 통신사 인증을 지원해요.
        </InfoRow>
        <Divider />
        <InfoRow icon={<Smartphone size={22} color={VIOLET} strokeWidth={2} />} title="본인 명의 휴대폰">
          인증 창에서 본인 명의 휴대폰 정보를 입력해주세요.
        </InfoRow>
        <Divider />
        <InfoRow icon={<Clock3 size={22} color={VIOLET} strokeWidth={2} />} title="1분이면 충분해요">
          인증이 끝나면 바로 간편 비밀번호를 만들어요.
        </InfoRow>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: '#86869f',
          letterSpacing: '-0.02em',
          lineHeight: 1.55,
          textAlign: 'center',
        }}
      >
        카카오 인증은 지원하지 않아요.
      </p>
    </OnboardingLayout>
  )
}

/** 안내 카드 한 줄 — 아이콘 배지 + 제목 + 설명. */
function InfoRow({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
      <span
        aria-hidden
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#efedff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#151519', letterSpacing: '-0.02em' }}>
          {title}
        </span>
        <span style={{ fontSize: 13.5, color: '#5c5c72', letterSpacing: '-0.02em', lineHeight: 1.5 }}>
          {children}
        </span>
      </span>
    </div>
  )
}

function Divider() {
  return <div aria-hidden style={{ height: 1, background: '#f2f2f6' }} />
}
