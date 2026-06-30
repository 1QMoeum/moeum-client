import { Bell, Wallet as WalletIcon, ChevronRight, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import type { UIEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import MoeumLogo from '@/components/ui/MoeumLogo'
import BottomNav from '@/components/ui/BottomNav'
import ProgressRing from '@/components/home/ProgressRing'
import HanaLogo from '@/components/icons/HanaLogo'
import { useMyWallet } from '@/hooks/wallet'
import { useMyAccount, useAccountBalance } from '@/hooks/account'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import { MOCK_PARTICIPATING_EVENTS } from '@/mocks/home'
import type { ParticipatingEvent } from '@/mocks/home'
import type { BankAccountResponse, MyDataBalanceResponse } from '@/types/api'

type Tab = 'events' | 'wallet'

const won = (n: number) => n.toLocaleString('ko-KR')

export default function MainPage() {
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

      <BottomNav />
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
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>
        {event.title}
      </h1>
      <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--color-text-secondary)' }}>
        {`D-${event.daysLeft} · 목표 ${won(event.targetAmount)}원`}
      </p>
      <p style={{ margin: '14px 0 24px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
          {won(event.currentAmount)}
        </span>
        <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>원</span>
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
          fontWeight: emphasize ? 800 : 700,
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

const BRAND_GRADIENT = 'linear-gradient(135deg, #5DD9D9 0%, #A78BFA 100%)'

/** 내 지갑 탭 — 실제 예금토큰 잔액 + 연동 계좌(+계좌 변경). */
function WalletView() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data: wallet, isPending, error } = useMyWallet(!!accessToken)
  const { data: account } = useMyAccount(!!accessToken)
  const { data: balance, isPending: balancePending } = useAccountBalance(account?.accountNumber)

  const noWallet = error?.status === ErrorCode.WALLET_NOT_FOUND

  return (
    <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 예금토큰 잔액 카드 */}
      {isPending ? (
        <div style={{ height: 150, borderRadius: 'var(--radius-xl)', background: '#eef0f3' }} />
      ) : noWallet ? (
        <EmptyWalletCard />
      ) : error ? (
        <ErrorCard message={`${error.message} (${error.status ?? '?'})`} />
      ) : wallet ? (
        <button
          type="button"
          onClick={() => navigate('/wallet')}
          style={{
            all: 'unset',
            boxSizing: 'border-box',
            cursor: 'pointer',
            background: BRAND_GRADIENT,
            borderRadius: 'var(--radius-xl)',
            padding: 24,
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            boxShadow: '0 12px 32px -8px rgba(167,139,250,0.45)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, opacity: 0.92 }}>
            <WalletIcon size={18} strokeWidth={2.4} />
            예금토큰 잔액
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
              {won(wallet.tokenBalance)}
            </span>
            <span style={{ fontSize: 18, fontWeight: 700, opacity: 0.92 }}>원</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>
            지갑 자세히 보기 (충전·전환)
            <ChevronRight size={14} strokeWidth={2.6} />
          </span>
        </button>
      ) : null}

      {/* 연동(충전) 계좌 + 변경 */}
      <FundingAccount
        account={account}
        balance={balance}
        balancePending={balancePending}
        onChange={() => navigate('/mydata/consent')}
      />
    </div>
  )
}

function EmptyWalletCard() {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#191f28' }}>
        <WalletIcon size={18} strokeWidth={2.2} color="#8B5CF6" />
        아직 지갑이 없어요
      </span>
      <span style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--color-text-secondary)' }}>
        충전 계좌를 연동하면 커스터디 지갑이 자동으로 만들어져요.
      </span>
    </div>
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

/** 연동 계좌 카드 — 미연동이면 연동 유도, 연동됐으면 정보 + "계좌 변경". */
function FundingAccount({
  account,
  balance,
  balancePending,
  onChange,
}: {
  account: BankAccountResponse | null | undefined
  balance: MyDataBalanceResponse | undefined
  balancePending: boolean
  onChange: () => void
}) {
  if (account === undefined) {
    return <div style={{ height: 92, borderRadius: 'var(--radius-xl)', background: '#eef0f3' }} />
  }

  if (account === null) {
    return (
      <button
        type="button"
        onClick={onChange}
        style={{
          all: 'unset',
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '18px 20px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28' }}>충전 계좌 연동하기</span>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            계좌를 연동하면 바로 충전·참여할 수 있어요
          </span>
        </span>
        <ChevronRight size={20} color="#adb5bd" style={{ flexShrink: 0 }} />
      </button>
    )
  }

  const isHana = account.accountType === 'HANA'

  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>충전 계좌</span>
        <button
          type="button"
          onClick={onChange}
          style={{
            all: 'unset',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            color: '#8B5CF6',
            letterSpacing: '-0.01em',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          계좌 변경
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isHana ? (
          <HanaLogo size={40} />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: '#0046FF',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            타행
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#191f28' }}>{account.accountHolder}</span>
          <span style={{ fontSize: 13, color: '#6b7684', fontVariantNumeric: 'tabular-nums' }}>
            {account.accountNumber}
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>출금 가능 금액</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#191f28', fontVariantNumeric: 'tabular-nums' }}>
          {balancePending ? '조회 중…' : balance ? `${won(balance.available_amt)}원` : '조회 실패'}
        </span>
      </div>
    </section>
  )
}
