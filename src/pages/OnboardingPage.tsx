import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLogout } from '@/hooks/auth'
import { useMyAccount, useAccountBalance } from '@/hooks/account'
import { useAuthStore } from '@/store/auth'
import OnboardingLayout from '@/components/onboarding/OnboardingLayout'
import StepHeader from '@/components/onboarding/StepHeader'
import CtaButton from '@/components/onboarding/CtaButton'
import AccountCard from '@/components/onboarding/AccountCard'
import BankAvatar from '@/components/wallet/BankAvatar'
import EnableNotificationModal from '@/components/notification/EnableNotificationModal'
import { getNotificationPermissionStatus } from '@/lib/firebase'

/**
 * 온보딩 03 — 인증 + (선택적으로) 계좌 연동 후 랜딩.
 * 연동 계좌 유무에 따라 메시지/액션 분기.
 *
 *  - undefined: 로딩
 *  - null: 미연동 → "로그인 완료" + 계좌 연동하러 가기
 *  - BankAccountResponse: 연동 완료 → 등록 계좌 카드 + 내 지갑 보기/시작하기
 *
 * userType 이 FOREIGN 이면 "계좌 연동하러 가기" 는 /plaid/consent 로,
 * 국내면 /mydata/consent 로 라우팅.
 */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const userType = useAuthStore((s) => s.userType)
  const setHasOnboarded = useAuthStore((s) => s.setHasOnboarded)
  const { mutate: logout, isPending } = useLogout()

  const { data: account } = useMyAccount(!!accessToken)
  const { data: balance } = useAccountBalance(account)

  // 온보딩을 본 디바이스로 기록 — 다음 로그인부터는 바로 /main 으로 (LoginPage 분기)
  useEffect(() => {
    setHasOnboarded()
  }, [setHasOnboarded])

  const [showNotifPrompt, setShowNotifPrompt] = useState(false)
  useEffect(() => {
    if (getNotificationPermissionStatus() === 'default') setShowNotifPrompt(true)
  }, [])

  if (!accessToken || !refreshToken) {
    return <Navigate to="/" replace />
  }

  const handleLogout = () => {
    logout(refreshToken, {
      onSettled: () => navigate('/', { replace: true }),
    })
  }

  const isLinked = account !== null && account !== undefined
  const linkPath = userType === 'FOREIGN' ? '/plaid/consent' : '/mydata/consent'

  const balanceText = balance
    ? balance.currency === 'KRW'
      ? `${balance.available.toLocaleString('ko-KR')}${t('wallet.balanceUnit')}`
      : `${balance.available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${balance.currency}`
    : undefined

  const footer = isLinked ? (
    <div style={{ display: 'flex', gap: 12 }}>
      <CtaButton variant="secondary" label={t('done.viewWallet')} onClick={() => navigate('/wallet')} />
      <CtaButton label={t('done.start')} onClick={() => navigate('/main')} />
    </div>
  ) : account === null ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <CtaButton label={t('done.goLink')} onClick={() => navigate(linkPath)} />
      <QuietTextButton label={t('done.startLater')} onClick={() => navigate('/main')} />
    </div>
  ) : (
    <div style={{ height: 56 }} />
  )

  return (
    <OnboardingLayout title={t('done.topbarTitle')} onBack={() => navigate(-1)} footer={footer}>
      <StepHeader
        step={isLinked ? '03' : undefined}
        title={
          account === undefined ? t('done.checking') : isLinked ? t('done.linked') : t('done.loginDone')
        }
        desc={
          account === undefined
            ? t('done.checkingSub')
            : isLinked
              ? t('done.linkedSub')
              : t('done.noAccountSub')
        }
      />

      {isLinked && account && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: '#222229',
            }}
          >
            {t('done.linkedCardLabel')}
          </h3>
          <AccountCard
            logo={<BankAvatar account={account} size={40} />}
            name={account.accountHolder}
            subtext={account.accountNumber}
            balanceText={balanceText}
          />
          <div style={{ display: 'flex', gap: 20, padding: '4px 4px 0' }}>
            <QuietTextButton label={t('done.changeAccount')} onClick={() => navigate(linkPath)} />
            <QuietTextButton
              label={isPending ? t('done.loggingOut') : t('done.logout')}
              onClick={handleLogout}
              disabled={isPending}
            />
          </div>
        </section>
      )}

      {account === null && (
        <div style={{ display: 'flex', padding: '4px 4px 0' }}>
          <QuietTextButton
            label={isPending ? t('done.loggingOut') : t('done.logout')}
            onClick={handleLogout}
            disabled={isPending}
          />
        </div>
      )}

      <EnableNotificationModal open={showNotifPrompt} onDismiss={() => setShowNotifPrompt(false)} />
    </OnboardingLayout>
  )
}

/** 보조 액션용 작은 텍스트 버튼 (계좌 변경·로그아웃·나중에 하기). */
function QuietTextButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        all: 'unset',
        padding: '10px 0',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14,
        fontWeight: 500,
        color: '#86869f',
        letterSpacing: '-0.01em',
        opacity: disabled ? 0.5 : 1,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

