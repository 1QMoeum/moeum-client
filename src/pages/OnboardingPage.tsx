import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLogout } from '@/hooks/auth'
import { accountApi } from '@/api/account'
import { useAuthStore } from '@/store/auth'
import Button from '@/components/ui/Button'
import HanaLogo from '@/components/icons/HanaLogo'
import EnableNotificationModal from '@/components/notification/EnableNotificationModal'
import { getNotificationPermissionStatus } from '@/lib/firebase'
import { resolvePlaidBrand } from '@/constants/bankBrand'
import type { BankAccountResponse } from '@/types/api'

/**
 * 인증 + (선택적으로) 계좌 연동 후 임시 랜딩.
 * 연동 계좌 유무에 따라 메시지/액션 분기.
 *
 *  - undefined: 로딩
 *  - null: 미연동 → "로그인 완료" + 계좌 연동하러 가기
 *  - BankAccountResponse: 연동됨 → "연동 완료" + 계좌 카드
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
  const { mutate: logout, isPending } = useLogout()

  const [account, setAccount] = useState<BankAccountResponse | null | undefined>(undefined)
  const [showNotifPrompt, setShowNotifPrompt] = useState(false)

  useEffect(() => {
    if (getNotificationPermissionStatus() === 'default') setShowNotifPrompt(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    void accountApi
      .myAccount()
      .then((a) => {
        if (!cancelled) setAccount(a)
      })
      .catch(() => {
        if (!cancelled) setAccount(null)
      })
    return () => {
      cancelled = true
    }
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

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '40px 24px 120px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              color: '#191f28',
            }}
          >
            {account === undefined
              ? t('done.checking')
              : isLinked
                ? t('done.linked')
                : t('done.loginDone')}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.5,
              color: '#6b7684',
              letterSpacing: '-0.01em',
              whiteSpace: 'pre-line',
            }}
          >
            {account === undefined
              ? t('done.checkingSub')
              : isLinked
                ? t('done.linkedSub')
                : t('done.noAccountSub')}
          </p>
        </header>

        {isLinked && account && <LinkedAccountCard account={account} />}
      </div>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          background: '#ffffff',
          padding: '12px 24px max(24px, env(safe-area-inset-bottom))',
          maxWidth: 480,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {account === null && (
          <>
            <Button variant="solid" onClick={() => navigate(linkPath)}>
              {t('done.goLink')}
            </Button>
            <button
              type="button"
              onClick={() => navigate('/main')}
              style={{
                all: 'unset',
                width: '100%',
                padding: '12px 0',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: '#6b7684',
                letterSpacing: '-0.01em',
              }}
            >
              {t('done.startLater')}
            </button>
          </>
        )}
        {isLinked && (
          <>
            <Button variant="solid" onClick={() => navigate('/main')}>
              {t('done.start')}
            </Button>
            <button
              type="button"
              onClick={() => navigate('/wallet')}
              style={{
                all: 'unset',
                width: '100%',
                padding: '12px 0',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: '#6b7684',
                letterSpacing: '-0.01em',
              }}
            >
              {t('done.viewWallet')}
            </button>
            <button
              type="button"
              onClick={() => navigate(linkPath)}
              style={{
                all: 'unset',
                width: '100%',
                padding: '12px 0',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: '#6b7684',
                letterSpacing: '-0.01em',
              }}
            >
              {t('done.changeAccount')}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          style={{
            all: 'unset',
            width: '100%',
            padding: '12px 0',
            textAlign: 'center',
            cursor: isPending ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: '#8b95a1',
            letterSpacing: '-0.01em',
            opacity: isPending ? 0.5 : 1,
          }}
        >
          {isPending ? t('done.loggingOut') : t('done.logout')}
        </button>
      </footer>
      <EnableNotificationModal
        open={showNotifPrompt}
        onDismiss={() => setShowNotifPrompt(false)}
      />
    </main>
  )
}

function LinkedAccountCard({ account }: { account: BankAccountResponse }) {
  const { t } = useTranslation()
  const isHana = account.accountType === 'HANA'
  const isPlaid = account.accountType === 'PLAID'
  // PLAID 인 경우 bankCode 에 institution_id 가 들어있어(예: ins_109508) 브랜드 조회 가능.
  const plaidBrand = isPlaid ? resolvePlaidBrand(account.bankCode, account.accountHolder) : null

  return (
    <section
      style={{
        padding: 20,
        background: '#f9fafb',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: '#8b95a1',
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
      >
        {t('done.linkedCardLabel')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isHana ? (
          <HanaLogo size={40} />
        ) : plaidBrand ? (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: plaidBrand.color,
              color: plaidBrand.fg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '-0.02em',
              flexShrink: 0,
            }}
          >
            {plaidBrand.short}
          </div>
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: '#0046FF',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '-0.02em',
              flexShrink: 0,
            }}
          >
            {t('done.otherBankBadge')}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#191f28',
              letterSpacing: '-0.01em',
            }}
          >
            {account.accountHolder}
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#6b7684',
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {account.accountNumber}
          </div>
        </div>
      </div>
    </section>
  )
}
