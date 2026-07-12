import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ChevronDown, Copy, Check } from 'lucide-react'
import { useEventDetail, useParticipateEvent } from '@/hooks/events'
import { useMyAccount, useAccountBalance, useAccountBrand } from '@/hooks/account'
import { useMyWallet } from '@/hooks/wallet'
import { useLogin } from '@/hooks/auth'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import { toErrorMessage } from '@/api/client'
import OnboardingLayout from '@/components/onboarding/OnboardingLayout'
import StepHeader from '@/components/onboarding/StepHeader'
import CtaButton from '@/components/onboarding/CtaButton'
import BankAvatar from '@/components/wallet/BankAvatar'
import PinSheet from '@/components/wallet/PinSheet'
import AccountSelectSheet from '@/components/wallet/AccountSelectSheet'
import dtCoin from '@/assets/dt-coin.png'
import sendingIllust from '@/assets/participate-sending.png'
import doneIllust from '@/assets/participate-done.png'
import { dDayLabel, fundingPercent } from '@/types/event'
import { maskAccountNum } from '@/lib/account'
import type { EventDetailResponse, ParticipateResponse } from '@/types/event'
import type { BankAccountResponse } from '@/types/api'

const VIOLET = '#665bf7'
const CARD_SHADOW = '0 0 8px rgba(21,21,21,0.04)'
const QUICK_AMOUNTS = [5_000, 10_000, 20_000, 50_000]

const comma = (n: number) => n.toLocaleString('ko-KR')

type Step = 'amount' | 'confirm' | 'review' | 'sending' | 'done'

const STEP_NO: Record<Step, string> = {
  amount: '01',
  confirm: '02',
  review: '03',
  sending: '04',
  done: '05',
}

/**
 * 모금 참여 플로우 (Figma 973:6315~6967).
 * 01 금액 설정 → 02 결제 정보 확인(보유 토큰 + 부족분 연결 계좌 자동 충전) →
 * 03 최종 확인 → PIN(간편 로그인 검증) → 04 전송중 → 05 완료.
 */
export default function ParticipatePage() {
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  const id = eventId ? Number(eventId) : null
  const validId = id !== null && Number.isFinite(id)
  const { data: event, isPending: eventPending } = useEventDetail(validId ? id : null)
  const { data: wallet } = useMyWallet(!!accessToken)
  const { data: account } = useMyAccount(!!accessToken)
  const { data: balance } = useAccountBalance(account)
  const participate = useParticipateEvent()
  const login = useLogin()

  const [step, setStep] = useState<Step>('amount')
  const [amountStr, setAmountStr] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)
  const amount = Number(amountStr)

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  // 보유 토큰으로 충당하는 금액 / 부족분(연결 계좌 자동 충전)
  const tokenBalance = wallet?.tokenBalance ?? 0
  const tokenUse = Math.min(tokenBalance, amount)
  const autoCharge = Math.max(0, amount - tokenBalance)
  const remainAfter = tokenBalance - tokenUse

  const participateError = (() => {
    if (!participate.error) return null
    switch (participate.error.status) {
      case ErrorCode.EVENT_ALREADY_PARTICIPATED:
        return '이미 참여한 모금이에요. (1인 1참여)'
      case ErrorCode.EVENT_NOT_ACTIVE:
        return '진행 중인 모금이 아니에요.'
      case ErrorCode.ACCOUNT_INSUFFICIENT:
        return '연동 통장 잔액이 부족해요. 통장을 확인해 주세요.'
      default:
        return toErrorMessage(participate.error)
    }
  })()

  const goBack = () => {
    if (step === 'confirm') setStep('amount')
    else if (step === 'review') setStep('confirm')
    else if (step === 'done') navigate(`/events/${id}`, { replace: true })
    else navigate(-1)
  }

  /** PIN 검증(간편 로그인, access 재발급) 후 참여 트랜잭션 실행. */
  const handlePin = (pin: string) => {
    if (!refreshToken) {
      navigate('/login', { replace: true })
      return
    }
    if (!validId) return
    login.mutate(
      { refreshToken, pin },
      {
        onSuccess: () => {
          setShowPin(false)
          setStep('sending')
          participate.mutate(
            { eventId: id, amount },
            {
              onSuccess: () => setStep('done'),
              // 실패 시 최종 확인으로 복귀 — participateError 배너 노출
              onError: () => setStep('review'),
            },
          )
        },
      },
    )
  }

  const footer = (() => {
    if (step === 'amount') {
      return <CtaButton label="다음" disabled={amount <= 0} onClick={() => setStep('confirm')} />
    }
    if (step === 'confirm') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: '#151519' }}>
              최종 결제 예정
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#7262fd', fontVariantNumeric: 'tabular-nums' }}>
                {comma(amount)}
              </span>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#5c5c72' }}>원</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em', color: '#5c5c72' }}>
              결제 후 잔여 토큰
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#2f2f3b', fontVariantNumeric: 'tabular-nums' }}>
                {comma(remainAfter)}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#5c5c72' }}>Hana-KRW</span>
            </span>
          </div>
          <div style={{ marginTop: 16 }}>
            <CtaButton label="다음" onClick={() => setStep('review')} />
          </div>
        </div>
      )
    }
    if (step === 'review') {
      return <CtaButton label="다음" onClick={() => setShowPin(true)} />
    }
    if (step === 'done' && participate.data) {
      return (
        <div style={{ display: 'flex', gap: 12 }}>
          <CtaButton
            variant="secondary"
            label="입금 내역 보기"
            onClick={() => window.open(participate.data.explorerTxUrl, '_blank', 'noopener')}
          />
          <CtaButton label="이벤트 보기" onClick={() => navigate(`/events/${id}`, { replace: true })} />
        </div>
      )
    }
    return undefined // sending — 하단 패널 없음
  })()

  return (
    <OnboardingLayout
      title="참여하기"
      onBack={step === 'sending' ? undefined : goBack}
      actions={<TopIcons onMyPage={() => navigate('/mypage')} />}
      footer={footer}
    >
      {eventPending || !event ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#adb5bd', fontSize: 14 }}>
          불러오는 중…
        </div>
      ) : (
        <>
          {step === 'amount' && (
            <>
              <StepHeader step={STEP_NO.amount} title="참여할 금액을 설정해주세요" />
              <AmountSection amountStr={amountStr} onAmount={setAmountStr} />
            </>
          )}

          {step === 'confirm' && (
            <>
              <StepHeader step={STEP_NO.confirm} title="결제 정보를 확인해주세요" />
              <PayAssetSection account={account} tokenBalance={tokenBalance} />
              <PayBreakdownSection
                amount={amount}
                tokenUse={tokenUse}
                autoCharge={autoCharge}
                account={account}
                accountBalance={balance?.currency === 'KRW' ? balance.available : undefined}
                onChangeAccount={() => setShowAccounts(true)}
              />
            </>
          )}

          {step === 'review' && (
            <>
              <StepHeader step={STEP_NO.review} title="참여 내용을 확인해주세요" />
              <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Subtitle>이벤트 정보</Subtitle>
                <EventInfoCard event={event} />
              </section>
              <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Subtitle>결제 내역</Subtitle>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: CARD_SHADOW,
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <AmountRow label="참여 금액" value={comma(amount)} unit="원" />
                  <AmountRow label="결제 수단" value="예금토큰 (Hana-KRW)" />
                  <AmountRow label="자동 충전 (연결 계좌)" value={comma(autoCharge)} unit="원" />
                  <div style={{ height: 1, background: '#f0f0f5' }} />
                  <AmountRow label="최종 결제 금액" value={comma(amount)} unit="원" accent />
                </div>
              </section>
              {participateError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 14px',
                    background: '#fff5f5',
                    borderRadius: 12,
                    color: '#e03e3e',
                    fontSize: 14,
                    letterSpacing: '-0.01em',
                  }}
                >
                  <AlertCircle size={16} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                  {participateError}
                </div>
              )}
            </>
          )}

          {step === 'sending' && (
            <>
              <StepHeader
                step={STEP_NO.sending}
                title="예금토큰을 전송하고 있어요"
                desc={'참여금이 안전하게 처리되고 있어요.\n잠시만 기다려주세요.'}
              />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={sendingIllust}
                  alt=""
                  aria-hidden
                  width={252}
                  height={252}
                  style={{ width: 252, height: 252, objectFit: 'contain' }}
                />
              </div>
            </>
          )}

          {step === 'done' && participate.data && (
            <>
              <StepHeader step={STEP_NO.done} title="참여가 완료되었어요!" />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src={doneIllust}
                  alt=""
                  aria-hidden
                  width={224}
                  height={224}
                  style={{ width: 224, height: 224, objectFit: 'contain' }}
                />
              </div>
              <DoneSummaryCard result={participate.data} />
            </>
          )}
        </>
      )}

      <PinSheet
        open={showPin}
        pending={login.isPending}
        error={login.error ? toErrorMessage(login.error) : null}
        onComplete={handlePin}
        onClose={() => {
          if (!login.isPending) setShowPin(false)
        }}
        onForgot={() => navigate('/login')}
      />
      <AccountSelectSheet open={showAccounts} onClose={() => setShowAccounts(false)} />
    </OnboardingLayout>
  )
}

/* ── 01 금액 설정 ─────────────────────────────────────────── */

function AmountSection({ amountStr, onAmount }: { amountStr: string; onAmount: (v: string) => void }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em', color: '#2f2f3b' }}>
        모금 금액
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 56,
          boxSizing: 'border-box',
          padding: '0 20px',
          background: '#fff',
          border: '1px solid #f6f6fa',
          borderRadius: 12,
          boxShadow: '0 0 16px rgba(21,21,21,0.04)',
        }}
      >
        <input
          inputMode="numeric"
          autoFocus
          placeholder="만원 단위로 입력"
          value={amountStr ? Number(amountStr).toLocaleString('ko-KR') : ''}
          onChange={(e) => onAmount(e.target.value.replace(/[^0-9]/g, ''))}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 16,
            fontWeight: 500,
            color: '#2f2f3b',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
        <span style={{ fontSize: 16, fontWeight: 500, color: '#2f2f3b', flexShrink: 0 }}>Hana-KRW</span>
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onAmount(String((Number(amountStr) || 0) + v))}
            style={{
              all: 'unset',
              boxSizing: 'border-box',
              flex: 1,
              textAlign: 'center',
              padding: '4px 12px',
              background: '#fff',
              borderRadius: 24,
              boxShadow: CARD_SHADOW,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: '#5c5c72',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {comma(v)}
          </button>
        ))}
      </div>
    </section>
  )
}

/* ── 02 결제 정보 확인 ────────────────────────────────────── */

function PayAssetSection({
  account,
  tokenBalance,
}: {
  account: BankAccountResponse | null | undefined
  tokenBalance: number
}) {
  const brand = useAccountBrand(account)
  const bankShort = brand === 'HANA' ? '하나은행' : (brand?.display ?? '연동 계좌')
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Subtitle>결제 자산</Subtitle>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: '12px 12px 0 0',
            boxShadow: CARD_SHADOW,
            padding: '20px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <img
              src={dtCoin}
              alt=""
              aria-hidden
              width={56}
              height={56}
              style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: '#151519' }}>
                예금토큰 (Hana-KRW)
              </span>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: '-0.02em',
                  color: '#5c5c72',
                  fontVariantNumeric: 'tabular-nums',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {account ? `${bankShort} ${account.accountNumber}` : '연동 계좌 없음'}
              </span>
            </div>
          </div>
          <Chip label="수수료 무료" />
        </div>
        <div style={{ height: 1, background: '#f0f0f5', margin: '0 16px' }} />
        <div
          style={{
            background: '#fff',
            borderRadius: '0 0 12px 12px',
            boxShadow: CARD_SHADOW,
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: 14, letterSpacing: '-0.02em', color: '#5c5c72' }}>보유 자산</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#0c0d0d', fontVariantNumeric: 'tabular-nums' }}
            >
              {comma(tokenBalance)}
            </span>
            <span style={{ fontSize: 18, letterSpacing: '-0.02em', color: '#2f2f3b' }}>Hana-KRW</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function PayBreakdownSection({
  amount,
  tokenUse,
  autoCharge,
  account,
  accountBalance,
  onChangeAccount,
}: {
  amount: number
  tokenUse: number
  autoCharge: number
  account: BankAccountResponse | null | undefined
  accountBalance: number | undefined
  onChangeAccount: () => void
}) {
  const brand = useAccountBrand(account)
  const bankShort = brand === 'HANA' ? '하나' : (brand?.short ?? '계좌')
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Subtitle>결제 내역</Subtitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: CARD_SHADOW,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <AmountRow label="참여 금액" value={comma(amount)} unit="원" />
          <AmountRow label="보유 토큰 사용" value={comma(tokenUse)} unit="원" />
        </div>

        {/* 부족분 자동 충전 + 출금 계좌 */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: CARD_SHADOW,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <AmountRow label="연결 계좌 자동 충전" value={comma(autoCharge)} unit="원" accent />
          <div style={{ height: 1, background: '#f0f0f5' }} />
          {account ? (
            <button
              type="button"
              onClick={onChangeAccount}
              aria-label="자동 충전 계좌 변경"
              style={{
                all: 'unset',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: 16,
                background: '#fff',
                borderRadius: 12,
                boxShadow: CARD_SHADOW,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                <BankAvatar account={account} size={36} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                  <Chip label="기본 계좌" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em', color: '#151519' }}>
                      {account.accountHolder}
                    </span>
                    <span
                      style={{ fontSize: 14, letterSpacing: '-0.02em', color: '#86869f', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {bankShort} {maskAccountNum(account.accountNumber)}
                    </span>
                  </div>
                  {accountBalance != null && (
                    <span
                      style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: '#151519', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {comma(accountBalance)}원
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown size={24} color="#5c5c72" style={{ flexShrink: 0 }} />
            </button>
          ) : (
            <span style={{ fontSize: 14, color: '#86869f', letterSpacing: '-0.01em' }}>
              연동된 충전 계좌가 없어요.
            </span>
          )}
        </div>
      </div>
    </section>
  )
}

/* ── 03 최종 확인 ─────────────────────────────────────────── */

function EventInfoCard({ event }: { event: EventDetailResponse }) {
  const rate = fundingPercent(event.currentAmount, event.targetAmount)
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: CARD_SHADOW,
        padding: '24px 16px',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <div
        style={{ width: 116, height: 113, borderRadius: 12, overflow: 'hidden', background: '#eef0f3', flexShrink: 0 }}
      >
        {event.representativeImageUrl && (
          <img
            src={event.representativeImageUrl}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#151519',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chip label={dDayLabel(event.endDate)} />
            <span style={{ fontSize: 14, letterSpacing: '-0.02em', color: '#86869f' }}>
              목표 {comma(event.targetAmount)}원
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 14, letterSpacing: '-0.02em', color: '#0c0d0d' }}>현재 모금액</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span
                style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: '#000', fontVariantNumeric: 'tabular-nums' }}
              >
                {comma(event.currentAmount)}
              </span>
              <span style={{ fontSize: 14, letterSpacing: '-0.02em', color: '#2f2f3b' }}>원</span>
            </span>
            <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em', color: VIOLET }}>{rate}%</span>
          </div>
          <div style={{ height: 4, marginTop: 4, borderRadius: 32, background: '#eaebed', overflow: 'hidden' }}>
            <div style={{ width: `${rate}%`, height: '100%', borderRadius: 32, background: VIOLET }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── 05 완료 ──────────────────────────────────────────────── */

function DoneSummaryCard({ result }: { result: ParticipateResponse }) {
  const [copied, setCopied] = useState(false)
  const copyTx = async () => {
    try {
      await navigator.clipboard.writeText(result.txHash)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 클립보드 미지원/거부 — 조용히 무시 */
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: CARD_SHADOW,
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em', color: '#5c5c72' }}>참여 금액</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#7262fd', fontVariantNumeric: 'tabular-nums' }}>
            {comma(result.amount)}
          </span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#5c5c72' }}>원</span>
        </span>
      </div>
      <SummaryRow label="결제 수단" value="예금토큰 (Hana-KRW)" />
      <SummaryRow label="입금 완료 시각" value={formatDateTime(result.participatedAt)} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em', color: '#5c5c72' }}>거래 ID</span>
        <button
          type="button"
          onClick={() => void copyTx()}
          aria-label="거래 ID 복사"
          style={{
            all: 'unset',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: '#151519',
            fontVariantNumeric: 'tabular-nums',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {shortenHash(result.txHash)}
          {copied ? (
            <Check size={20} strokeWidth={2.4} color="#12b886" />
          ) : (
            <Copy size={20} strokeWidth={1.8} color="#5c5c72" />
          )}
        </button>
      </div>
    </div>
  )
}

/* ── 공용 소품 ────────────────────────────────────────────── */

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em', color: '#222229' }}>
      {children}
    </h2>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        padding: '0 8px',
        borderRadius: 4,
        background: '#e3e1ff',
        color: VIOLET,
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}

function AmountRow({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: string
  unit?: string
  accent?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em', color: '#5c5c72', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontSize: accent ? 20 : 16,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: accent ? VIOLET : '#0c0d0d',
            fontVariantNumeric: 'tabular-nums',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em', color: '#5c5c72' }}>{unit}</span>
        )}
      </span>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em', color: '#5c5c72' }}>{label}</span>
      <span
        style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em', color: '#151519', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
    </div>
  )
}

/** 탑바 우측 알림·마이페이지 아이콘 (Figma Solid 세트 — MainPage 와 동일 경로). */
function TopIcons({ onMyPage }: { onMyPage: () => void }) {
  const iconButton = (label: string, onClick: (() => void) | undefined, path: React.ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        display: 'flex',
        cursor: 'pointer',
        color: '#5c5c72',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        {path}
      </svg>
    </button>
  )
  return (
    <>
      {iconButton(
        '알림',
        undefined,
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3V3.75H10.4426C8.21751 3.75 6.37591 5.48001 6.23702 7.70074L6.01601 11.2342C5.93175 12.5814 5.47946 13.8797 4.7084 14.9876C4.01172 15.9886 4.63194 17.3712 5.84287 17.5165L9.25 17.9254V19C9.25 20.5188 10.4812 21.75 12 21.75C13.5188 21.75 14.75 20.5188 14.75 19V17.9254L18.1571 17.5165C19.3681 17.3712 19.9883 15.9886 19.2916 14.9876C18.5205 13.8797 18.0682 12.5814 17.984 11.2342L17.763 7.70074C17.6241 5.48001 15.7825 3.75 13.5574 3.75H13V3ZM10.75 19C10.75 19.6904 11.3096 20.25 12 20.25C12.6904 20.25 13.25 19.6904 13.25 19V18.25H10.75V19Z"
        />,
      )}
      {iconButton(
        '내 정보',
        onMyPage,
        <>
          <path d="M12 3.75C9.92893 3.75 8.25 5.42893 8.25 7.5C8.25 9.57107 9.92893 11.25 12 11.25C14.0711 11.25 15.75 9.57107 15.75 7.5C15.75 5.42893 14.0711 3.75 12 3.75Z" />
          <path d="M8 13.25C5.92893 13.25 4.25 14.9289 4.25 17V18.1883C4.25 18.9415 4.79588 19.5837 5.53927 19.7051C9.8181 20.4037 14.1819 20.4037 18.4607 19.7051C19.2041 19.5837 19.75 18.9415 19.75 18.1883V17C19.75 14.9289 18.0711 13.25 16 13.25H15.6591C15.4746 13.25 15.2913 13.2792 15.1159 13.3364L14.2504 13.6191C12.7881 14.0965 11.2119 14.0965 9.74959 13.6191L8.88407 13.3364C8.70869 13.2792 8.52536 13.25 8.34087 13.25H8Z" />
        </>,
      )}
    </>
  )
}

/** 0x1234…abcd 형태로 줄임. */
function shortenHash(hash: string): string {
  if (hash.length <= 13) return hash
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

/** ISO 문자열 → 'YYYY.MM.DD HH:mm' (실패 시 원본). */
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
