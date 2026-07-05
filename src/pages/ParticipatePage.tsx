import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'
import { useEventDetail, useParticipateEvent } from '@/hooks/events'
import { useMyAccount } from '@/hooks/account'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import { toErrorMessage } from '@/api/client'
import Button from '@/components/ui/Button'
import { fundingPercent } from '@/types/event'
import type { EventDetailResponse, ParticipateResponse } from '@/types/event'
import type { BankAccountResponse } from '@/types/api'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const QUICK_AMOUNTS = [10_000, 30_000, 50_000, 100_000]

type Step = 'setup' | 'confirm' | 'done'

/** 모금 참여 — 결제 설정 → 결제 확인 → 요청 완료(스텝퍼). */
export default function ParticipatePage() {
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()
  const accessToken = useAuthStore((s) => s.accessToken)

  const id = eventId ? Number(eventId) : null
  const validId = id !== null && Number.isFinite(id)
  const { data: event, isPending: eventPending } = useEventDetail(validId ? id : null)
  const { data: account } = useMyAccount(!!accessToken)
  const participate = useParticipateEvent()

  const [step, setStep] = useState<Step>('setup')
  const [amountStr, setAmountStr] = useState('')
  const amount = Number(amountStr)

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  const errorText = (() => {
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
    if (step === 'confirm') setStep('setup')
    else navigate(-1)
  }

  const requestPay = () => {
    if (!validId) return
    participate.mutate(
      { eventId: id, amount },
      { onSuccess: () => setStep('done') },
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '8px 20px calc(20px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* 상단 바 */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 8 }}>
          <button
            type="button"
            onClick={goBack}
            aria-label="뒤로"
            disabled={step === 'done'}
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 12,
              cursor: step === 'done' ? 'default' : 'pointer',
              color: step === 'done' ? '#d8dbe0' : '#191f28',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={26} />
          </button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#191f28', letterSpacing: '-0.02em' }}>
            참여하기
          </h1>
        </header>

        <Stepper step={step} />

        {step === 'done' && participate.data ? (
          <DoneView result={participate.data} eventId={id} onGoEvent={() => navigate(`/events/${id}`, { replace: true })} />
        ) : eventPending || !event ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#adb5bd', fontSize: 14 }}>
            불러오는 중…
          </div>
        ) : step === 'setup' ? (
          <SetupView
            event={event}
            account={account}
            amount={amount}
            amountStr={amountStr}
            onAmount={setAmountStr}
            onNext={() => setStep('confirm')}
          />
        ) : (
          <ConfirmView
            event={event}
            account={account}
            amount={amount}
            pending={participate.isPending}
            errorText={errorText}
            onPay={requestPay}
          />
        )}
      </div>
    </main>
  )
}

function Stepper({ step }: { step: Step }) {
  const items: Array<{ key: Step; label: string }> = [
    { key: 'setup', label: '결제 설정' },
    { key: 'confirm', label: '결제 확인' },
    { key: 'done', label: '요청 완료' },
  ]
  const order: Step[] = ['setup', 'confirm', 'done']
  const curIdx = order.indexOf(step)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '18px 4px 8px' }}>
      {items.map((it, i) => {
        const reached = i <= curIdx
        return (
          <div key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: i < items.length - 1 ? 1 : 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: reached ? '#8B5CF6' : '#dcdce3',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12.5, fontWeight: reached ? 700 : 500, color: reached ? '#191f28' : '#adb5bd', letterSpacing: '-0.01em' }}>
                {it.label}
              </span>
            </span>
            {i < items.length - 1 && (
              <span style={{ flex: 1, height: 1.5, background: i < curIdx ? '#8B5CF6' : '#ededf2', borderRadius: 999 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function EventInfoCard({ event }: { event: EventDetailResponse }) {
  const rate = fundingPercent(event.currentAmount, event.targetAmount)
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 16, background: '#f9fafb', borderRadius: 18 }}>
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: '#eef0f3', flexShrink: 0 }}>
          {event.representativeImageUrl && (
            <img src={event.representativeImageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </span>
          <span style={{ fontSize: 12.5, color: '#8b95a1', letterSpacing: '-0.01em' }}>
            목표 {won(event.targetAmount)}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12.5, color: '#8b95a1', letterSpacing: '-0.01em' }}>현재 모금액</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#8B5CF6' }}>{rate}%</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#191f28', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
          {won(event.currentAmount)}
        </div>
        <div style={{ height: 8, background: '#ededf2', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${rate}%`, height: '100%', background: '#8B5CF6', borderRadius: 999 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#adb5bd' }}>
          <span>0</span>
          <span>{won(event.targetAmount)}</span>
        </div>
      </div>
    </section>
  )
}

function PaymentMethod({ account }: { account: BankAccountResponse | null | undefined }) {
  const bank = account?.accountType === 'HANA' ? '하나은행' : '연동 계좌'
  return (
    <section
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        border: '1.5px solid #ededf2',
        borderRadius: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: '#f3f0ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        🪙
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: '#191f28', letterSpacing: '-0.01em' }}>
          나의 예금토큰
        </span>
        <span style={{ fontSize: 12.5, color: '#8b95a1', letterSpacing: '-0.01em' }}>
          {account ? `${bank} ${account.accountNumber}` : '연동 계좌 없음'}
        </span>
      </div>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: '#6b7684',
          background: '#f1f3f5',
          padding: '4px 8px',
          borderRadius: 8,
          flexShrink: 0,
        }}
      >
        수수료 무료
      </span>
    </section>
  )
}

function SetupView({
  event,
  account,
  amount,
  amountStr,
  onAmount,
  onNext,
}: {
  event: EventDetailResponse
  account: BankAccountResponse | null | undefined
  amount: number
  amountStr: string
  onAmount: (v: string) => void
  onNext: () => void
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 8 }}>
      <Section title="이벤트 정보">
        <EventInfoCard event={event} />
      </Section>

      <Section title="결제 수단">
        <PaymentMethod account={account} />
      </Section>

      <Section title="참여 금액 입력">
        <input
          inputMode="numeric"
          placeholder="금액을 입력하세요"
          value={amountStr ? Number(amountStr).toLocaleString('ko-KR') : ''}
          onChange={(e) => onAmount(e.target.value.replace(/[^0-9]/g, ''))}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '14px 16px',
            background: '#f9fafb',
            border: '1.5px solid #f2f4f6',
            borderRadius: 14,
            fontSize: 18,
            fontWeight: 700,
            color: '#191f28',
            letterSpacing: '-0.01em',
            outline: 'none',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
        <span style={{ fontSize: 12, color: '#adb5bd', letterSpacing: '-0.01em' }}>*직접 입력할 수 있어요</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onAmount(String((Number(amountStr) || 0) + v))}
              style={{
                all: 'unset',
                padding: '9px 14px',
                background: '#f5f5f7',
                color: '#6b7684',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {(v / 10_000).toLocaleString('ko-KR')}만원
            </button>
          ))}
        </div>
      </Section>

      <div style={{ flex: 1 }} />

      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 4px',
        }}
      >
        <span style={{ fontSize: 13.5, color: '#8b95a1', letterSpacing: '-0.01em' }}>최종 결제 예정</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#8B5CF6', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
          {won(amount)}
        </span>
      </section>

      <Button variant="solid" onClick={onNext} disabled={amount <= 0}>
        결제 요청하기
      </Button>
    </div>
  )
}

function ConfirmView({
  event,
  account,
  amount,
  pending,
  errorText,
  onPay,
}: {
  event: EventDetailResponse
  account: BankAccountResponse | null | undefined
  amount: number
  pending: boolean
  errorText: string | null
  onPay: () => void
}) {
  const bank = account?.accountType === 'HANA' ? '하나은행' : '연동 계좌'
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 8 }}>
      <Section title="참여 내용 확인">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 18, background: '#f9fafb', borderRadius: 18 }}>
          <Row label="이벤트" value={event.title} />
          <Row label="결제 수단" value={`나의 예금토큰${account ? ` · ${bank}` : ''}`} />
          <div style={{ height: 1, background: '#ededf2', margin: '12px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#191f28', letterSpacing: '-0.01em' }}>참여 금액</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#8B5CF6', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {won(amount)}
            </span>
          </div>
        </section>
      </Section>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '12px 14px',
          background: '#f3f0ff',
          borderRadius: 12,
          color: '#6a5ce6',
          fontSize: 12.5,
          lineHeight: 1.5,
          letterSpacing: '-0.01em',
        }}
      >
        <AlertCircle size={15} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
        예금토큰이 부족하면 연동 통장에서 부족분이 자동충전된 뒤 이벤트 에스크로로 입금돼요.
      </div>

      {errorText && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 14px',
            background: '#fff5f5',
            borderRadius: 12,
            color: '#e03e3e',
            fontSize: 13,
            letterSpacing: '-0.01em',
          }}
        >
          <AlertCircle size={16} strokeWidth={2.2} style={{ flexShrink: 0 }} />
          {errorText}
        </div>
      )}

      <div style={{ flex: 1 }} />

      <Button variant="solid" onClick={onPay} disabled={pending || amount <= 0}>
        {pending ? '입금 중…' : `${won(amount)} 참여 확정하기`}
      </Button>
    </div>
  )
}

function DoneView({
  result,
  eventId,
  onGoEvent,
}: {
  result: ParticipateResponse
  eventId: number | null
  onGoEvent: () => void
}) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const confirmed = result.status === 'ACTIVE'

  const copyTx = async () => {
    try {
      await navigator.clipboard.writeText(result.txHash)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 무시 */
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        {confirmed ? (
          <CheckCircle2 size={56} strokeWidth={2} color="#12b886" />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Hourglass size={28} strokeWidth={2.2} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 19, fontWeight: 800, color: '#191f28', letterSpacing: '-0.02em' }}>
            {confirmed ? '모금 참여가 완료되었습니다!' : '결제 요청이 완료되었습니다!'}
          </span>
          <span style={{ fontSize: 13.5, color: '#8b95a1', lineHeight: 1.5, letterSpacing: '-0.01em' }}>
            {confirmed ? '응원해주셔서 감사합니다 💜' : '입금 승인 완료 후 참여가 최종 확정돼요.'}
          </span>
        </div>
      </div>

      {/* 결과 상세 */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 18, background: '#f9fafb', borderRadius: 18 }}>
        <Row label="참여 금액" value={won(result.amount)} strong />
        <Row label="참여 일시" value={formatDateTime(result.participatedAt)} />
        <Row label="결제 수단" value="예금토큰" />
        <Row label="참여 상태" value={confirmed ? '완료' : '입금 승인 대기'} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0' }}>
          <span style={{ fontSize: 13.5, color: '#8b95a1', letterSpacing: '-0.01em' }}>승인 TxID</span>
          <button
            type="button"
            onClick={() => void copyTx()}
            style={{
              all: 'unset',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: 13.5,
              fontWeight: 600,
              color: '#191f28',
              fontVariantNumeric: 'tabular-nums',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {shortenHash(result.txHash)}
            {copied ? <Check size={15} color="#12b886" strokeWidth={2.6} /> : <Copy size={15} color="#8b95a1" strokeWidth={2.2} />}
          </button>
        </div>
      </section>

      {/* 링크 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <LinkRow href={result.explorerTxUrl} label="입금 트랜잭션 보기" />
        <LinkRow href={result.eventEscrowUrl} label="이벤트 에스크로 보기" />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => navigate('/explore')}
          style={{
            all: 'unset',
            flex: 1,
            boxSizing: 'border-box',
            textAlign: 'center',
            padding: '15px 0',
            borderRadius: 12,
            background: '#f1f3f5',
            color: '#3a4149',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          참여 내역 보기
        </button>
        <Button variant="solid" onClick={onGoEvent} style={{ flex: 1 }} disabled={eventId === null}>
          이벤트 바로가기
        </Button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#191f28', letterSpacing: '-0.01em' }}>{title}</span>
      {children}
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 0' }}>
      <span style={{ fontSize: 13.5, color: '#8b95a1', letterSpacing: '-0.01em', flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: strong ? 16 : 14,
          fontWeight: strong ? 800 : 600,
          color: strong ? '#8B5CF6' : '#191f28',
          letterSpacing: '-0.01em',
          textAlign: 'right',
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

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: '#f9fafb',
        borderRadius: 14,
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: 600,
        color: '#3a4149',
        letterSpacing: '-0.01em',
      }}
    >
      {label}
      <ExternalLink size={17} strokeWidth={2.2} color="#8b95a1" />
    </a>
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
