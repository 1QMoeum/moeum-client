import { Bell } from 'lucide-react'
import { useState } from 'react'
import type { UIEvent } from 'react'
import MoeumLogo from '@/components/ui/MoeumLogo'
import BottomNav from '@/components/ui/BottomNav'
import ProgressRing from '@/components/home/ProgressRing'
import { MOCK_PARTICIPATING_EVENTS } from '@/mocks/home'
import type { ParticipatingEvent } from '@/mocks/home'

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
          <WalletView events={events} />
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

function WalletView({ events }: { events: ParticipatingEvent[] }) {
  const total = events.reduce((sum, e) => sum + e.currentAmount, 0)
  return (
    <div style={{ padding: '32px 24px 0' }}>
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          padding: 24,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>참여중 모금액 합계</p>
        <p style={{ margin: '10px 0 0', fontSize: 32, fontWeight: 800, color: 'var(--color-text-primary)' }}>
          {won(total)}원
        </p>
      </div>
      <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {events.map((e) => (
          <li
            key={e.eventId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '16px 18px',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600 }}>{e.title}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-accent)' }}>
              {won(e.currentAmount)}원
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
