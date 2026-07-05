import { Wallet as WalletIcon, ChevronRight, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import type { UIEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '@/components/ui/BottomNav'
import ProgressRing from '@/components/home/ProgressRing'
import { useMyWallet } from '@/hooks/wallet'
import { useMyAccount } from '@/hooks/account'
import { useParticipatingEvents } from '@/hooks/events'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import type { ParticipatingEvent } from '@/types/event'

type Tab = 'events' | 'wallet'

const won = (n: number) => n.toLocaleString('ko-KR')

/** 서버 날짜(YYYY-MM-DD) → 화면 표기(YY.MM.DD) */
const shortDate = (iso: string) => iso.slice(2).replaceAll('-', '.')

export default function MainPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('events')
  const [index, setIndex] = useState(0)
  const { data, isLoading, error } = useParticipatingEvents()
  const events = data?.content ?? []
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
          padding: '0 0 140px',
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
            height: 56,
            padding: '10px 20px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <img
              src="/moeum-favicon.svg"
              alt="moeum"
              draggable={false}
              style={{ height: 36, width: 'auto', userSelect: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeaderIconButton label="알림">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3V3.75H10.4426C8.21751 3.75 6.37591 5.48001 6.23702 7.70074L6.01601 11.2342C5.93175 12.5814 5.47946 13.8797 4.7084 14.9876C4.01172 15.9886 4.63194 17.3712 5.84287 17.5165L9.25 17.9254V19C9.25 20.5188 10.4812 21.75 12 21.75C13.5188 21.75 14.75 20.5188 14.75 19V17.9254L18.1571 17.5165C19.3681 17.3712 19.9883 15.9886 19.2916 14.9876C18.5205 13.8797 18.0682 12.5814 17.984 11.2342L17.763 7.70074C17.6241 5.48001 15.7825 3.75 13.5574 3.75H13V3ZM10.75 19C10.75 19.6904 11.3096 20.25 12 20.25C12.6904 20.25 13.25 19.6904 13.25 19V18.25H10.75V19Z"
              />
            </HeaderIconButton>
            <HeaderIconButton label="내 정보" onClick={() => navigate('/mypage')}>
              <path d="M12 3.75C9.92893 3.75 8.25 5.42893 8.25 7.5C8.25 9.57107 9.92893 11.25 12 11.25C14.0711 11.25 15.75 9.57107 15.75 7.5C15.75 5.42893 14.0711 3.75 12 3.75Z" />
              <path d="M8 13.25C5.92893 13.25 4.25 14.9289 4.25 17V18.1883C4.25 18.9415 4.79588 19.5837 5.53927 19.7051C9.8181 20.4037 14.1819 20.4037 18.4607 19.7051C19.2041 19.5837 19.75 18.9415 19.75 18.1883V17C19.75 14.9289 18.0711 13.25 16 13.25H15.6591C15.4746 13.25 15.2913 13.2792 15.1159 13.3364L14.2504 13.6191C12.7881 14.0965 11.2119 14.0965 9.74959 13.6191L8.88407 13.3364C8.70869 13.2792 8.52536 13.25 8.34087 13.25H8Z" />
            </HeaderIconButton>
          </div>
        </header>

        {/* 세그먼트 토글 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 24px 0' }}>
          <div
            role="tablist"
            aria-label="홈 보기 전환"
            style={{
              display: 'inline-flex',
              padding: 4,
              borderRadius: 24,
              background: 'var(--color-surface)',
              boxShadow: '0 0 16px rgba(21,21,21,0.04)',
            }}
          >
            <SegmentButton label="참여중인 이벤트" active={tab === 'events'} onClick={() => setTab('events')} />
            <SegmentButton label="내 지갑" active={tab === 'wallet'} onClick={() => setTab('wallet')} />
          </div>
        </div>

        {tab === 'events' ? (
          isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '160px 24px 0' }}>
              <div style={{ width: 256, height: 256, borderRadius: '50%', background: '#eef0f3' }} />
            </div>
          ) : error ? (
            <div style={{ padding: '24px 24px 0' }}>
              <ErrorCard message={`${error.message} (${error.status ?? '?'})`} />
            </div>
          ) : events.length === 0 ? (
            <EmptyEvents onExplore={() => navigate('/explore')} />
          ) : (
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
              {events.map((ev, i) => (
                <EventSlide key={ev.eventId} event={ev} active={i === index} />
              ))}
            </div>

            {/* 인디케이터 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '20px 0 0' }}>
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
            <div style={{ padding: '32px 24px 0' }}>
              <div
                style={{
                  display: 'flex',
                  background: 'var(--color-surface)',
                  borderRadius: 24,
                  padding: '16px 8px',
                  boxShadow: '0 0 8px rgba(21,21,21,0.04)',
                }}
              >
                <Stat label="참여자" value={`${won(active.participantCount)}명`} />
                <Divider />
                <Stat label="달성률" value={`${Math.round(active.fundingRate)}%`} />
                <Divider />
                <Stat label="마감일" value={shortDate(active.endDate)} />
              </div>
            </div>
          </>
          )
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
        padding: '8px 16px',
        borderRadius: 24,
        border: 'none',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        lineHeight: 1.5,
        background: active ? 'var(--color-accent)' : 'transparent',
        color: active ? '#fff' : '#2f2f3b',
        transition: 'background 0.2s ease, color 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function EventSlide({ event, active }: { event: ParticipatingEvent; active: boolean }) {
  const percent = event.fundingRate
  return (
    <section
      style={{
        flex: '0 0 100%',
        scrollSnapAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 24px 0',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 19,
          fontWeight: 700,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          color: '#151519',
        }}
      >
        {event.title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <span
          style={{
            padding: '0 8px',
            borderRadius: 4,
            background: '#e3e1ff',
            color: 'var(--color-accent)',
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.5,
            letterSpacing: '-0.02em',
          }}
        >
          {`D-${event.dDay}`}
        </span>
        <span style={{ fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#86869f' }}>
          {`목표 ${won(event.targetAmount)}원`}
        </span>
      </div>
      <p style={{ margin: '4px 0 32px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          style={{
            fontSize: 38,
            fontWeight: 700,
            lineHeight: 1.5,
            letterSpacing: '-0.02em',
            color: '#0c0d0d',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {won(event.currentAmount)}
        </span>
        <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: '#222229' }}>원</span>
      </p>

      <ProgressRing percent={percent} size={256} active={active}>
        <EventImage event={event} />
      </ProgressRing>
    </section>
  )
}

function EventImage({ event }: { event: ParticipatingEvent }) {
  if (event.representativeImageUrl) {
    return (
      <img
        src={event.representativeImageUrl}
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

/** 참여중인 이벤트가 없을 때의 빈 상태 — 일러스트 + 안내 문구 + 탐색 유도 버튼. */
function EmptyEvents({ onExplore }: { onExplore: () => void }) {
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px 0',
      }}
    >
      <img
        src="/home-empty-events.png"
        alt=""
        aria-hidden
        width={240}
        height={240}
        style={{ display: 'block', objectFit: 'contain' }}
      />
      <h1
        style={{
          margin: '24px 0 0',
          fontSize: 18,
          fontWeight: 600,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          color: '#151519',
        }}
      >
        참여중인 이벤트가 없어요
      </h1>
      <p
        style={{
          margin: '12px 0 0',
          fontSize: 14,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          color: '#86869f',
          textAlign: 'center',
        }}
      >
        마음에 드는 이벤트에 참여하고
        <br />
        함께 목표를 달성해보세요!
      </p>
      <button
        type="button"
        onClick={onExplore}
        style={{
          marginTop: 40,
          padding: '12px 32px',
          borderRadius: 24,
          border: 'none',
          background: 'var(--color-accent)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 500,
          lineHeight: 1.5,
          letterSpacing: '-0.02em',
          cursor: 'pointer',
          boxShadow: '0 0 8px rgba(21,21,21,0.04)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        이벤트 참여하기
      </button>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#5c5c72' }}>
        {label}
      </span>
      <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#151519' }}>
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 24, alignSelf: 'center', background: 'var(--color-track)' }} />
}

/** 상단 바 우측 solid 아이콘 버튼 (24px, Figma Solid 아이콘 세트). */
function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
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
        {children}
      </svg>
    </button>
  )
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
        <div style={{ width: 256, height: 256, borderRadius: '50%', background: '#eef0f3' }} />
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
      <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: 'var(--color-text-primary)' }}>
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
        <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {won(wallet.tokenBalance)}
        </span>
        <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)' }}>원</span>
      </p>

      <button
        type="button"
        onClick={() => navigate('/wallet')}
        aria-label="내 지갑 보기"
        style={{ all: 'unset', cursor: 'pointer', borderRadius: '50%', WebkitTapHighlightColor: 'transparent' }}
      >
        <TokenSphere size={256} />
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

