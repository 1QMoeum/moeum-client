import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronDown, ArrowRight, ExternalLink } from 'lucide-react'
import { useMyWallet, useChargeWallet, useWithdrawWallet } from '@/hooks/wallet'
import { useMyAccount, useAccountBalance } from '@/hooks/account'
import { useLogin } from '@/hooks/auth'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import { toErrorMessage } from '@/api/client'
import Button from '@/components/ui/Button'
import BankAvatar from '@/components/wallet/BankAvatar'
import PinSheet from '@/components/wallet/PinSheet'
import AccountSelectSheet from '@/components/wallet/AccountSelectSheet'
import successIllustration from '@/assets/wallet-success.png'
import type { WalletTxResponse } from '@/types/api'

type Mode = 'charge' | 'convert'

const VIOLET = '#665bf7'
const GRAY_900 = '#151519'
const GRAY_500 = '#86869f'
const GRAY_600 = '#5c5c72'
const PAGE_BG = '#fafafa'
const CARD_SHADOW = '0 0 16px 0 rgba(21, 21, 21, 0.04)'

const QUICK_AMOUNTS = [10_000, 50_000, 100_000, 1_000_000]

/** 2026.06.07 14:32 형태의 로케일 무관 타임스탬프. */
function formatStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * 충전(원→토큰)·전환(토큰→원) 공용 페이지.
 * 금액 입력 → 비밀번호 확인(PinSheet) → PIN 검증(간편 로그인) → 트랜잭션 → 완료 화면.
 * PIN 검증은 /v1/auth/login(refresh+PIN)으로 한다 — PIN 을 실제로 확인하는 동시에
 * access 토큰을 재발급받아, 화면에 머무는 동안 토큰이 만료돼도 트랜잭션이
 * '인증 필요' 로 실패하지 않게 한다. mode 로 방향/문구/단위만 갈라진다.
 */
export default function WalletTxPage({ mode }: { mode: Mode }) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const userType = useAuthStore((s) => s.userType)
  const clearTokens = useAuthStore((s) => s.clearTokens)

  const { data: wallet, error: walletError } = useMyWallet(!!accessToken)
  const { data: account } = useMyAccount(!!accessToken)
  const { data: balance, isPending: balancePending } = useAccountBalance(account)

  const charge = useChargeWallet()
  const withdraw = useWithdrawWallet()
  const tx = mode === 'charge' ? charge : withdraw
  const login = useLogin()

  const [amountStr, setAmountStr] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)
  const [result, setResult] = useState<WalletTxResponse | null>(null)
  const [txStamp, setTxStamp] = useState<string | null>(null)

  const numberLocale = i18n.resolvedLanguage === 'ko' ? 'ko-KR' : 'en-US'
  const compact = new Intl.NumberFormat(numberLocale, { notation: 'compact', maximumFractionDigits: 1 })
  const unit = mode === 'charge' ? t('wallet.tokenUnit') : t('wallet.balanceUnit')

  if (!accessToken) return <Navigate to="/" replace />
  if (walletError?.status === ErrorCode.WALLET_NOT_FOUND) return <Navigate to="/wallet" replace />

  const tokenBalance = wallet?.tokenBalance ?? 0
  const availableKrw = balance?.currency === 'KRW' ? balance.available : undefined
  const amount = Number(amountStr)
  const overBalance = mode === 'convert' && amount > tokenBalance
  const overAvailable = mode === 'charge' && availableKrw != null && amount > availableKrw
  const canSubmit = amount > 0 && !overBalance && !result

  const errorText = (() => {
    if (login.error) return toErrorMessage(login.error)
    if (!tx.error) return null
    if (tx.error.status === ErrorCode.INSUFFICIENT_BALANCE) return t('wallet.insufficientBalance')
    return toErrorMessage(tx.error)
  })()

  const accountBalanceText =
    availableKrw != null ? `${availableKrw.toLocaleString(numberLocale)}${t('wallet.balanceUnit')}` : undefined

  const runTx = (pin: string) => {
    if (!refreshToken) {
      navigate('/login', { replace: true })
      return
    }
    // 1) PIN 검증 + access 재발급 (간편 로그인) → 2) 트랜잭션.
    // useLogin 의 onSuccess(setTokens)가 먼저 실행되므로 트랜잭션은 새 토큰으로 나간다.
    login.mutate(
      { refreshToken, pin },
      {
        onSuccess: () => {
          tx.mutate(
            { amount },
            {
              onSuccess: (data) => {
                setResult(data)
                setTxStamp(formatStamp(new Date()))
                setShowPin(false)
              },
            },
          )
        },
        onError: (e) => {
          // refresh 만료/위조 — 재인증부터 다시
          if (e.status === ErrorCode.REFRESH_INVALID) {
            clearTokens()
            navigate(userType === 'FOREIGN' ? '/kyc/foreign' : '/kyc', { replace: true })
          }
        },
      },
    )
  }

  // ── 완료 화면 ────────────────────────────────────────────────
  if (result) {
    const doneTitle = mode === 'charge' ? t('wallet.chargeDoneTitle') : t('wallet.convertDoneTitle')
    const amountLabel = mode === 'charge' ? t('wallet.chargeAmountLabel') : t('wallet.convertAmountLabel')
    const dateLabel = mode === 'charge' ? t('wallet.chargeDate') : t('wallet.convertDate')
    return (
      <TxScreen title={mode === 'charge' ? t('wallet.chargeCta') : t('wallet.convertCta')} onBack={() => navigate('/wallet')}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: GRAY_900, letterSpacing: '-0.02em' }}>
            {doneTitle}
          </h2>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
            <img
              src={successIllustration}
              alt=""
              width={220}
              height={220}
              style={{ width: 220, height: 220, objectFit: 'contain' }}
            />
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: CARD_SHADOW,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 14, color: GRAY_500, letterSpacing: '-0.01em' }}>{amountLabel}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: VIOLET, letterSpacing: '-0.02em' }}>
                  {amount.toLocaleString(numberLocale)} {unit}
                </span>
                <span style={{ fontSize: 14, color: GRAY_500, letterSpacing: '-0.01em' }}>
                  {result.tokenBalance.toLocaleString(numberLocale)} {unit}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 14, color: GRAY_500, letterSpacing: '-0.01em' }}>{dateLabel}</span>
              <span
                style={{ fontSize: 16, fontWeight: 600, color: GRAY_900, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}
              >
                {txStamp}
              </span>
            </div>
            <a
              href={result.explorerTxUrl}
              target="_blank"
              rel="noreferrer noopener"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
                color: VIOLET,
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              {t('wallet.viewTx')}
              <ExternalLink size={15} strokeWidth={2.4} />
            </a>
          </div>
        </div>

        <Footer>
          <Button
            variant="ghost"
            onClick={() => navigate('/main')}
            style={{ flex: 1, borderRadius: 24, padding: '15px 20px' }}
          >
            {t('wallet.goMain')}
          </Button>
          <Button
            variant="solid"
            onClick={() => navigate('/wallet')}
            style={{ flex: 1, borderRadius: 24, padding: '15px 20px' }}
          >
            {t('wallet.goWallet')}
          </Button>
        </Footer>
      </TxScreen>
    )
  }

  // ── 입력 화면 ────────────────────────────────────────────────
  const pageTitle = mode === 'charge' ? t('wallet.chargePageTitle') : t('wallet.convertPageTitle')
  const pageSubtitle = mode === 'charge' ? t('wallet.chargePageSubtitle') : t('wallet.convertPageSubtitle')
  const amountLabel = mode === 'charge' ? t('wallet.chargeAmountLabel') : t('wallet.convertAmountLabel')

  const accountCard = (
    <HoldingCard
      avatar={account ? <BankAvatar account={account} size={28} /> : undefined}
      title={account ? account.accountHolder : t('wallet.linkAccount')}
      value={balancePending ? '…' : accountBalanceText ?? t('wallet.loadFail')}
      onChevron={() => setShowAccounts(true)}
    />
  )
  const tokenCard = (
    <HoldingCard title={t('wallet.tokenLabel')} value={`${tokenBalance.toLocaleString(numberLocale)} ${t('wallet.tokenUnit')}`} />
  )

  return (
    <TxScreen title={mode === 'charge' ? t('wallet.chargeCta') : t('wallet.convertCta')} onBack={() => navigate('/wallet')}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: GRAY_900, letterSpacing: '-0.02em' }}>
            {pageTitle}
          </h2>
          <p style={{ margin: 0, fontSize: 16, color: GRAY_500, letterSpacing: '-0.01em' }}>{pageSubtitle}</p>
        </div>

        {/* 현재 보유 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: GRAY_600, letterSpacing: '-0.01em' }}>
            {t('wallet.currentHolding')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {mode === 'charge' ? accountCard : tokenCard}
            <ArrowRight size={20} color={VIOLET} strokeWidth={2.4} style={{ flexShrink: 0 }} />
            {mode === 'charge' ? tokenCard : accountCard}
          </div>
        </div>

        {/* 금액 입력 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: GRAY_600, letterSpacing: '-0.01em' }}>{amountLabel}</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              padding: '18px 20px',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: CARD_SHADOW,
              border: `1.5px solid ${overBalance ? '#ffc9c9' : 'transparent'}`,
            }}
          >
            <input
              inputMode="numeric"
              autoFocus
              placeholder=""
              value={amountStr ? Number(amountStr).toLocaleString(numberLocale) : ''}
              onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 22,
                fontWeight: 700,
                color: GRAY_900,
                letterSpacing: '-0.02em',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            />
            <span style={{ fontSize: 16, fontWeight: 500, color: GRAY_500, flexShrink: 0 }}>{unit}</span>
          </div>

          {mode === 'convert' && (
            <span style={{ fontSize: 14, color: overBalance ? '#e03e3e' : GRAY_500, letterSpacing: '-0.01em' }}>
              {overBalance
                ? t('wallet.overBalance')
                : t('wallet.convertableUpTo', { amount: tokenBalance.toLocaleString(numberLocale) })}
            </span>
          )}
          {mode === 'charge' && availableKrw != null && (
            <span style={{ fontSize: 14, color: overAvailable ? '#f08c00' : GRAY_500, letterSpacing: '-0.01em' }}>
              {t('wallet.availableUpTo', { amount: availableKrw.toLocaleString(numberLocale) })}
            </span>
          )}

          {/* 빠른 금액 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmountStr(String((Number(amountStr) || 0) + v))}
                style={{
                  all: 'unset',
                  flex: 1,
                  minWidth: 56,
                  textAlign: 'center',
                  padding: '10px 8px',
                  background: '#ffffff',
                  boxShadow: CARD_SHADOW,
                  color: GRAY_600,
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                +{compact.format(v)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Footer>
        <Button
          variant="solid"
          onClick={() => {
            if (!canSubmit) return
            login.reset()
            tx.reset()
            setShowPin(true)
          }}
          disabled={!canSubmit}
          style={{ borderRadius: 24, padding: '16px 20px' }}
        >
          {mode === 'charge' ? t('wallet.chargeCta') : t('wallet.convertCta')}
        </Button>
      </Footer>

      <PinSheet
        open={showPin}
        pending={login.isPending || tx.isPending}
        error={errorText}
        onComplete={runTx}
        onClose={() => {
          if (!login.isPending && !tx.isPending) setShowPin(false)
        }}
        onForgot={() => navigate('/login')}
      />

      <AccountSelectSheet open={showAccounts} onClose={() => setShowAccounts(false)} />
    </TxScreen>
  )
}

/** 페이지 골격: 상단바(뒤로 + 제목) + 스크롤 본문 + 하단 고정 푸터. */
function TxScreen({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <main style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '8px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 4, height: 56, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onBack}
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
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#27282c', letterSpacing: '-0.02em' }}>{title}</h1>
        </header>
        {children}
      </div>
    </main>
  )
}

/** 하단 고정 액션 영역. (상위 컨테이너가 이미 좌우 패딩을 갖고 있어 수평 패딩은 두지 않는다.) */
function Footer({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        gap: 12,
        padding: '12px 0 max(20px, env(safe-area-inset-bottom))',
        background: PAGE_BG,
      }}
    >
      {children}
    </div>
  )
}

/** 현재 보유 카드 (계좌/토큰 공용). */
function HoldingCard({
  avatar,
  title,
  value,
  onChevron,
}: {
  avatar?: ReactNode
  title: string
  value: string
  onChevron?: () => void
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        boxSizing: 'border-box',
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: CARD_SHADOW,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {avatar}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 14,
            fontWeight: 500,
            color: GRAY_600,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        {onChevron && (
          <button
            type="button"
            onClick={onChevron}
            aria-label={title}
            style={{
              all: 'unset',
              display: 'flex',
              cursor: 'pointer',
              color: GRAY_500,
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronDown size={18} strokeWidth={2.2} />
          </button>
        )}
      </div>
      <span
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: GRAY_900,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  )
}
