import { Bell, Wallet as WalletIcon, ChevronRight, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import type { UIEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import MoeumLogo from '@/components/ui/MoeumLogo'
import BottomNav from '@/components/ui/BottomNav'
import ProgressRing from '@/components/home/ProgressRing'
import { useMyWallet } from '@/hooks/wallet'
import { useMyAccount } from '@/hooks/account'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import { MOCK_PARTICIPATING_EVENTS } from '@/mocks/home'
import type { ParticipatingEvent } from '@/mocks/home'

type Tab = 'events' | 'wallet'

const won = (n: number) => n.toLocaleString('ko-KR')

export default function MainPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('events')
  const [index, setIndex] = useState(0)
  const events = MOCK_PARTICIPATING_EVENTS
  const active = events[index] ?? events[0]

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const next = Math.round(el.scrollLeft / el.clientWidth)
    if (next !== index) setIndex(next)
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100%' }}>
      <main
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '8px 0 96px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 상단 바 */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px 4px',
          }}
        >
          <MoeumLogo height={28} />
          <button
            type="button"
            aria-label="알림"
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Bell size={24} />
          </button>
        </header>

        {/* 세그먼트 토글 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 24px 4px' }}>
          <div
            role="tablist"
            aria-label="홈 보기 전환"
            style={{
              display: 'inline-flex',
              padding: 5,
              borderRadius: 999,
              background: 'var(--color-surface)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <SegmentButton label="참여중인 이벤트" active={tab === 'events'} onClick={() => setTab('events')} />
            <SegmentButton label="내 지갑" active={tab === 'wallet'} onClick={() => setTab('wallet')} />
          </div>
        </div>

        {tab === 'events' ? (
          <>
            {/* 캐러셀 */}
            <div
              onScroll={onScroll}
              style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {events.map((ev) => (
                <EventSlide key={ev.eventId} event={ev} />
              ))}
            </div>

            {/* 인디케이터 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '20px 0 8px' }}>
              {events.map((ev, i) => (
                <span
                  key={ev.eventId}
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: i === index ? 'var(--color-accent)' : 'var(--color-track)',
                    transition: 'background 0.2s ease',
                  }}
                />
              ))}
            </div>

            {/* 통계 카드 */}
            <div style={{ padding: '12px 24px 0' }}>
              <div
                style={{
                  display: 'flex',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--color-border)',
                  padding: '20px 8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <Stat label="참여자" value={`${won(active.participantCount)}명`} />
                <Divider />
                <Stat
                  label="달성률"
                  value={`${Math.round((active.currentAmount / active.targetAmount) * 100)} %`}
                  emphasize
                />
                <Divider />
                <Stat label="진행일" value={active.startedAt} />
              </div>
            </div>
          </>
        ) : (
          <WalletView />
        )}
      </main>

      <BottomNav onCreate={() => navigate('/events/new')} />
    </div>
  )
}

function SegmentButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: '10px 20px',
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        fontSize: 15,
        fontWeight: 700,
        background: active ? '#6e6e76' : 'transparent',
        color: active ? '#fff' : 'var(--color-text-secondary)',
        transition: 'background 0.2s ease, color 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function EventSlide({ event }: { event: ParticipatingEvent }) {
  const percent = (event.currentAmount / event.targetAmount) * 100
  return (
    <section
      style={{
        flex: '0 0 100%',
        scrollSnapAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 24px 0',
      }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {event.title}
      </h1>
      <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--color-text-secondary)' }}>
        {`D-${event.daysLeft} · 목표 ${won(event.targetAmount)}원`}
      </p>
      <p style={{ margin: '14px 0 24px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
          {won(event.currentAmount)}
        </span>
        <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)' }}>원</span>
      </p>

      <ProgressRing percent={percent} size={272}>
        <EventImage event={event} />
      </ProgressRing>
    </section>
  )
}

function EventImage({ event }: { event: ParticipatingEvent }) {
  if (event.imageUrl) {
    return (
      <img
        src={event.imageUrl}
        alt={event.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    )
  }
  // 이미지 없을 때 — 부드러운 그라데이션 플레이스홀더
  return (
    <div
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ffe1ec 0%, #f3d4f0 55%, #dcd6f7 100%)',
        color: 'rgba(124,111,240,0.55)',
        fontSize: 15,
        fontWeight: 700,
      }}
    >
      이미지 준비중
    </div>
  )
}

function Stat({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span
        style={{
          fontSize: 20,
          fontWeight: emphasize ? 700 : 600,
          color: 'var(--color-text-primary)',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--color-border)', margin: '2px 0' }} />
}

/** 내 지갑 탭 — 예금토큰 잔액을 이벤트 탭과 같은 레이아웃(제목·계좌·금액·구슬)으로 표시. */
function WalletView() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data: wallet, isPending, error } = useMyWallet(!!accessToken)
  const { data: account } = useMyAccount(!!accessToken)

  const noWallet = error?.status === ErrorCode.WALLET_NOT_FOUND

  if (isPending) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 24px 0' }}>
        <div style={{ width: 272, height: 272, borderRadius: '50%', background: '#eef0f3' }} />
      </div>
    )
  }
  if (noWallet) {
    return (
      <div style={{ padding: '24px 24px 0' }}>
        <EmptyWalletCard onLink={() => navigate('/mydata/consent')} />
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ padding: '24px 24px 0' }}>
        <ErrorCard message={`${error.message} (${error.status ?? '?'})`} />
      </div>
    )
  }
  if (!wallet) return null

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 24px 0',
      }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
        하나 예금토큰
      </h1>
      <button
        type="button"
        onClick={() => navigate('/mydata/consent')}
        aria-label={account ? '충전 계좌 변경' : '충전 계좌 연동'}
        style={{
          all: 'unset',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          margin: '8px 0 0',
          fontSize: 15,
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          fontVariantNumeric: 'tabular-nums',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {account
          ? `${account.accountType === 'HANA' ? '하나은행' : '연동 계좌'} ${account.accountNumber}`
          : '충전 계좌 연동하기'}
        <ChevronRight size={15} strokeWidth={2.4} />
      </button>
      <p style={{ margin: '14px 0 24px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {won(wallet.tokenBalance)}
        </span>
        <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)' }}>원</span>
      </p>

      <button
        type="button"
        onClick={() => navigate('/wallet')}
        aria-label="내 지갑 보기"
        style={{ all: 'unset', cursor: 'pointer', borderRadius: '50%', WebkitTapHighlightColor: 'transparent' }}
      >
        <TokenSphere size={272} />
      </button>

      <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
        <ActionPill label="출금하기" variant="outline" onClick={() => navigate('/wallet?action=withdraw')} />
        <ActionPill label="충전하기" variant="filled" onClick={() => navigate('/wallet?action=charge')} />
      </div>
    </section>
  )
}

/** 유리 구슬 속 토큰 방울들 — 예금토큰 잔액의 장식 비주얼. */
function TokenSphere({ size }: { size: number }) {
  const blob = (css: React.CSSProperties) => (
    <span style={{ position: 'absolute', borderRadius: '50%', ...css }} />
  )
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #fdfdfe 0%, #f1f1f6 100%)',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: 'inset 0 3px 12px rgba(255,255,255,0.9), inset 0 -10px 24px rgba(124,111,240,0.10), 0 12px 28px rgba(0,0,0,0.07)',
      }}
    >
      {blob({ left: '30%', top: '26%', width: '26%', height: '26%', background: '#a99df7' })}
      {blob({ left: '54%', top: '32%', width: '13%', height: '13%', background: '#8f80f2' })}
      {blob({ left: '14%', top: '38%', width: '20%', height: '20%', background: '#7fd8cf' })}
      {blob({ left: '64%', top: '42%', width: '9%', height: '9%', background: '#67c8be' })}
      {/* 아래쪽 큰 방울 무리 — 젤리처럼 뭉개진 느낌 */}
      {blob({ left: '10%', top: '46%', width: '80%', height: '46%', background: 'linear-gradient(135deg, #8f80f2 0%, #7c6ff0 60%, #6fd0c6 100%)', filter: 'blur(14px)', opacity: 0.9 })}
      {blob({ left: '38%', top: '40%', width: '30%', height: '30%', background: '#7c6ff0', filter: 'blur(6px)', opacity: 0.85 })}
      {/* 유리 하이라이트 */}
      {blob({ left: '14%', top: '8%', width: '36%', height: '18%', background: 'rgba(255,255,255,0.75)', filter: 'blur(10px)' })}
    </div>
  )
}

/** 지갑 탭 하단 액션 버튼 (출금/충전). */
function ActionPill({
  label,
  variant,
  onClick,
}: {
  label: string
  variant: 'outline' | 'filled'
  onClick: () => void
}) {
  const filled = variant === 'filled'
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        padding: '14px 32px',
        borderRadius: 999,
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        color: '#191f28',
        background: filled ? '#e9e9ee' : '#fff',
        border: `1px solid ${filled ? '#e9e9ee' : '#ececf0'}`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function EmptyWalletCard({ onLink }: { onLink: () => void }) {
  return (
    <button
      type="button"
      onClick={onLink}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        width: '100%',
        cursor: 'pointer',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#191f28' }}>
        <WalletIcon size={18} strokeWidth={2.2} color="#8B5CF6" />
        아직 지갑이 없어요
      </span>
      <span style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--color-text-secondary)' }}>
        충전 계좌를 연동하면 커스터디 지갑이 자동으로 만들어져요.
        <ChevronRight size={13} strokeWidth={2.4} style={{ verticalAlign: -2, marginLeft: 2 }} />
      </span>
    </button>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div
      style={{
        background: '#fff5f5',
        borderRadius: 'var(--radius-xl)',
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: '#e03e3e',
        fontSize: 13.5,
      }}
    >
      <AlertCircle size={18} strokeWidth={2.2} style={{ flexShrink: 0 }} />
      {message}
    </div>
  )
}

