import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Copy, Check, ExternalLink, Wallet as WalletIcon, AlertCircle } from 'lucide-react'
import { useMyWallet } from '@/hooks/wallet'
import { useMyAccount, useAccountBalance, type AccountBalance } from '@/hooks/account'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import Button from '@/components/ui/Button'
import BankAvatar from '@/components/wallet/BankAvatar'
import AccountSelectSheet from '@/components/wallet/AccountSelectSheet'
import type { WalletResponse, BankAccountResponse } from '@/types/api'

const GRADIENT = 'linear-gradient(103deg, #56d2c9 0%, #665bf7 100%)'
const VIOLET = '#665bf7'
const VIOLET_100 = '#e3e1ff'
const GRAY_900 = '#151519'
const GRAY_800 = '#222229'
const GRAY_600 = '#5c5c72'
const GRAY_500 = '#86869f'
const BLACK = '#0c0d0d'
const PAGE_BG = '#fafafa'
const CARD_SHADOW = '0 0 16px 0 rgba(21, 21, 21, 0.04)'

/** 주소를 0x1234…abcd 형태로 줄임. */
function shortenAddress(address: string): string {
  if (address.length <= 13) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/**
 * 내 커스터디 지갑 화면.
 * 그라데이션 잔액 카드(충전/전환 진입) + 지갑 주소·익스플로러 + 연결 계좌.
 * 지갑 미생성(3000)은 빈 상태로 안내한다.
 */
export default function WalletPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data: wallet, isPending, error, refetch, isFetching } = useMyWallet(!!accessToken)

  if (!accessToken) return <Navigate to="/" replace />

  const noWallet = error?.status === ErrorCode.WALLET_NOT_FOUND

  return (
    <main style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '8px 20px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          boxSizing: 'border-box',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 4, height: 56 }}>
          <button
            type="button"
            onClick={() => navigate('/main')}
            aria-label={t('wallet.back')}
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              cursor: 'pointer',
              color: '#27282c',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={26} />
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#27282c', letterSpacing: '-0.02em' }}>
            {t('wallet.title')}
          </h1>
        </header>

        {isPending && <WalletSkeleton />}
        {!isPending && noWallet && <EmptyWallet />}
        {!isPending && error && !noWallet && (
          <ErrorState message={error.message} onRetry={() => void refetch()} retrying={isFetching} />
        )}
        {!isPending && wallet && <WalletView wallet={wallet} />}
      </div>
    </main>
  )
}

function WalletView({ wallet }: { wallet: WalletResponse }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const userType = useAuthStore((s) => s.userType)
  const consentPath = userType === 'FOREIGN' ? '/plaid/consent' : '/mydata/consent'
  const [copied, setCopied] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)
  const { data: account } = useMyAccount(true)
  const { data: balance, isPending: balancePending } = useAccountBalance(account)
  const numberLocale = i18n.resolvedLanguage === 'ko' ? 'ko-KR' : 'en-US'

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet.walletAddress)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 클립보드 미지원/거부 — 조용히 무시 (주소는 화면에 노출돼 있음) */
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* 잔액 카드 (그라데이션 + 프로스티드 액션 패널) */}
      <section
        style={{
          position: 'relative',
          borderRadius: 20,
          background: GRADIENT,
          padding: '24px 20px 20px',
          boxShadow: '0 12px 32px -12px rgba(102, 91, 247, 0.4)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 28 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#f6f6fa', letterSpacing: '-0.02em' }}>
            {t('wallet.tokenName')}
          </span>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {wallet.tokenBalance.toLocaleString(numberLocale)}
            </span>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#e0e0ed', letterSpacing: '-0.02em' }}>
              {t('wallet.tokenUnit')}
            </span>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            gap: 12,
            padding: 14,
            borderRadius: 16,
            // blur 미지원 웹뷰에서도 프로스티드 유리로 보이도록 반투명 그라데이션 + 하이라이트로 구성.
            // backdrop-filter 는 지원 환경에서의 향상 효과로만 유지.
            background: 'linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.20))',
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          {/* 위로 향한 노치 */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: -7,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid rgba(255, 255, 255, 0.34)',
            }}
          />
          <PillButton label={t('wallet.chargeCta')} onClick={() => navigate('/wallet/charge')} />
          <PillButton label={t('wallet.convertCta')} filled onClick={() => navigate('/wallet/convert')} />
        </div>
      </section>

      {/* 지갑 주소 + 익스플로러 */}
      <section style={{ background: '#ffffff', borderRadius: 16, boxShadow: CARD_SHADOW, padding: '4px 16px' }}>
        <button
          type="button"
          onClick={() => void copyAddress()}
          style={{
            all: 'unset',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            boxSizing: 'border-box',
            padding: '16px 0',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ fontSize: 14, color: GRAY_600, letterSpacing: '-0.01em' }}>{t('wallet.walletAddress')}</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: BLACK, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
              {shortenAddress(wallet.walletAddress)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, color: copied ? '#12b886' : GRAY_500 }}>
              {copied ? <Check size={20} strokeWidth={2.4} /> : <Copy size={20} strokeWidth={2} />}
            </span>
          </div>
        </button>

        <div style={{ height: 1, background: '#f0f0f5' }} />

        <a
          href={wallet.explorerUrl}
          target="_blank"
          rel="noreferrer noopener"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: '16px 0',
            textDecoration: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ fontSize: 14, color: GRAY_600, letterSpacing: '-0.01em' }}>{t('wallet.explorer')}</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: BLACK, letterSpacing: '-0.01em' }}>
              {t('wallet.viewOnChain')}
            </span>
            <ExternalLink size={20} strokeWidth={2} color={GRAY_500} style={{ flexShrink: 0 }} />
          </div>
        </a>
      </section>

      {/* 연결 계좌 */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: GRAY_800, letterSpacing: '-0.02em' }}>
          {t('wallet.connectedAccount')}
        </h2>

        <ConnectedAccount account={account} balance={balance} balancePending={balancePending} />

        <button
          type="button"
          onClick={() => (account ? setShowAccounts(true) : navigate(consentPath))}
          style={{
            all: 'unset',
            boxSizing: 'border-box',
            textAlign: 'center',
            width: '100%',
            padding: '14px',
            borderRadius: 24,
            background: '#ffffff',
            boxShadow: CARD_SHADOW,
            color: VIOLET,
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('wallet.changeAccount')}
        </button>
      </section>

      <p style={{ margin: 0, padding: '0 4px', fontSize: 12, lineHeight: 1.6, color: '#adb5bd', letterSpacing: '-0.01em' }}>
        {t('wallet.privateKeyNote')}
      </p>

      <AccountSelectSheet open={showAccounts} onClose={() => setShowAccounts(false)} />
    </div>
  )
}

function PillButton({ label, filled, onClick }: { label: string; filled?: boolean; onClick: () => void }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        all: 'unset',
        flex: 1,
        boxSizing: 'border-box',
        textAlign: 'center',
        padding: '12px',
        borderRadius: 24,
        cursor: 'pointer',
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: '-0.01em',
        color: filled ? '#ffffff' : '#474c52',
        background: filled ? VIOLET : '#ffffff',
        boxShadow: '0 0 8px rgba(21, 21, 21, 0.04)',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.12s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

/** 연결 계좌 카드 — 로딩/미연동/연동 세 상태. */
function ConnectedAccount({
  account,
  balance,
  balancePending,
}: {
  account: BankAccountResponse | null | undefined
  balance: AccountBalance | null | undefined
  balancePending: boolean
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (account === undefined) {
    return <div style={{ height: 132, borderRadius: 16, background: '#eef0f3' }} />
  }

  if (account === null) {
    return (
      <button
        type="button"
        onClick={() => navigate('/mydata/consent')}
        style={{
          all: 'unset',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '18px 16px',
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: CARD_SHADOW,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: GRAY_900, letterSpacing: '-0.01em' }}>
            {t('wallet.linkAccount')}
          </span>
          <span style={{ fontSize: 14, color: GRAY_500, letterSpacing: '-0.01em' }}>{t('wallet.linkAccountSub')}</span>
        </div>
        <ChevronLeft size={20} color="#adb5bd" style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
      </button>
    )
  }

  const balanceText = balancePending
    ? t('wallet.loading')
    : balance
      ? balance.currency === 'KRW'
        ? `${balance.available.toLocaleString('ko-KR')}${t('wallet.balanceUnit')}`
        : `${balance.available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${balance.currency}`
      : t('wallet.loadFail')

  return (
    <section style={{ background: '#ffffff', borderRadius: 16, boxShadow: CARD_SHADOW, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <BankAvatar account={account} size={40} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '1px 8px',
              borderRadius: 4,
              background: VIOLET_100,
              color: VIOLET,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            {t('wallet.primaryAccount')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: GRAY_900, letterSpacing: '-0.01em' }}>
              {account.accountHolder}
            </span>
            <span style={{ fontSize: 14, color: GRAY_500, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
              {account.accountNumber}
            </span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#f0f0f5' }} />

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 14, color: GRAY_500, letterSpacing: '-0.01em' }}>{t('wallet.availableBalance')}</span>
        <span
          style={{ fontSize: 18, fontWeight: 600, color: GRAY_900, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
        >
          {balanceText}
        </span>
      </div>
    </section>
  )
}

function WalletSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ height: 200, borderRadius: 20, background: 'linear-gradient(135deg, #eef0f3 0%, #e6e8ec 100%)' }} />
      <div style={{ height: 120, borderRadius: 16, background: '#eef0f3' }} />
      <div style={{ height: 132, borderRadius: 16, background: '#eef0f3' }} />
    </div>
  )
}

function EmptyWallet() {
  const { t } = useTranslation()
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: CARD_SHADOW,
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: '#f3f0ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: VIOLET,
        }}
      >
        <WalletIcon size={28} strokeWidth={2.2} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: GRAY_900, letterSpacing: '-0.02em' }}>{t('wallet.emptyTitle')}</div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: GRAY_500, letterSpacing: '-0.01em', maxWidth: 260 }}>
        {t('wallet.emptyDesc')}
      </p>
    </div>
  )
}

function ErrorState({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  const { t } = useTranslation()
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: CARD_SHADOW,
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
      }}
    >
      <AlertCircle size={36} strokeWidth={2} color="#e03e3e" />
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: GRAY_600, letterSpacing: '-0.01em' }}>{message}</p>
      <Button variant="solid" onClick={onRetry} disabled={retrying} style={{ width: 'auto', padding: '12px 28px' }}>
        {retrying ? t('wallet.retrying') : t('wallet.retry')}
      </Button>
    </div>
  )
}
