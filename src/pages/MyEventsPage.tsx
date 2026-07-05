import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import ErrorBanner from '@/components/ui/ErrorBanner'
import { useOperatingEvents, useParticipatingEvents } from '@/hooks/events'
import { useMyBookmarks } from '@/hooks/bookmark'
import { toErrorMessage } from '@/api/client'
import { categoryImage, fundingPercent } from '@/types/event'
import type { EventStatus } from '@/types/event'

/** 마이페이지에서 진입하는 내 이벤트 목록 탭. */
type MyEventsTab = 'participating' | 'operating' | 'bookmarked'

const TAB_LABEL: Record<MyEventsTab, string> = {
  participating: '참여중',
  operating: '운영중',
  bookmarked: '관심 이벤트',
}

const TAB_ORDER: MyEventsTab[] = ['participating', 'operating', 'bookmarked']

/** 마감 임박 판정 기준(일). EventListPage 와 동일. */
const CLOSING_DAYS = 7

const won = (n: number) => n.toLocaleString('ko-KR')

/** 참여/관심 응답을 카드 렌더용으로 정규화한 공통 뷰모델. */
interface MyEventCard {
  eventId: number
  title: string
  category: string
  status: EventStatus
  representativeImageUrl: string | null
  currentAmount: number
  targetAmount: number
  endDate: string
}

/**
 * 내 이벤트 목록 — 참여중(GET /v1/events/participating)·관심(GET /v1/users/me/bookmarks).
 * 마이페이지 카운트를 누르면 해당 탭으로 진입한다. 운영중은 목록 API가 아직 없어 안내만 노출.
 */
export default function MyEventsPage() {
  const navigate = useNavigate()
  const { tab } = useParams<{ tab: string }>()

  if (!tab || !TAB_ORDER.includes(tab as MyEventsTab)) {
    return <Navigate to="/mypage/events/participating" replace />
  }
  const activeTab = tab as MyEventsTab

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100%' }}>
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 48px' }}>
        {/* 탑바 */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 56,
            padding: '10px 20px',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer' }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M14.5 6.5 9 12l5.5 5.5" stroke="#27282c" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#27282c' }}>
            내 이벤트
          </h1>
        </header>

        {/* 탭 스위처 */}
        <nav
          role="tablist"
          aria-label="내 이벤트 분류"
          style={{ display: 'flex', gap: 8, padding: '8px 20px 16px' }}
        >
          {TAB_ORDER.map((t) => {
            const active = t === activeTab
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => navigate(`/mypage/events/${t}`, { replace: true })}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 24,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  background: active ? 'var(--color-accent)' : '#fff',
                  color: active ? '#fff' : '#5c5c72',
                  boxShadow: '0 0 8px rgba(21,21,21,0.04)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {TAB_LABEL[t]}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '0 20px' }}>
          <TabPanel tab={activeTab} onOpenEvent={(id) => navigate(`/events/${id}`)} />
        </div>
      </main>
    </div>
  )
}

/** 선택된 탭의 목록을 알맞은 훅으로 조회해 렌더. */
function TabPanel({ tab, onOpenEvent }: { tab: MyEventsTab; onOpenEvent: (eventId: number) => void }) {
  if (tab === 'participating') return <ParticipatingPanel onOpenEvent={onOpenEvent} />
  if (tab === 'bookmarked') return <BookmarkedPanel onOpenEvent={onOpenEvent} />
  return <OperatingPanel onOpenEvent={onOpenEvent} />
}

function ParticipatingPanel({ onOpenEvent }: { onOpenEvent: (eventId: number) => void }) {
  const { data, isPending, error } = useParticipatingEvents()
  // 내가 총대인(운영중) 이벤트는 '운영중' 탭에만 보이도록 참여중 목록에서 제외한다.
  const { data: operatingData } = useOperatingEvents()
  const operatingIds = useMemo(
    () => new Set((operatingData?.content ?? []).map((e) => e.eventId)),
    [operatingData],
  )
  const cards = useMemo<MyEventCard[]>(
    () =>
      (data?.content ?? [])
        .filter((e) => !operatingIds.has(e.eventId))
        .map((e) => ({
          eventId: e.eventId,
          title: e.title,
          category: e.category,
          status: e.status,
          representativeImageUrl: e.representativeImageUrl,
          currentAmount: e.currentAmount,
          targetAmount: e.targetAmount,
          endDate: e.endDate,
        })),
    [data, operatingIds],
  )
  return (
    <ListBody
      cards={cards}
      isPending={isPending}
      error={error ? toErrorMessage(error) : null}
      emptyText="참여중인 이벤트가 없어요."
      onOpenEvent={onOpenEvent}
    />
  )
}

function BookmarkedPanel({ onOpenEvent }: { onOpenEvent: (eventId: number) => void }) {
  const { data, isPending, error } = useMyBookmarks()
  const cards = useMemo<MyEventCard[]>(
    () =>
      (data?.content ?? []).map((e) => ({
        eventId: e.eventId,
        title: e.title,
        category: e.category,
        status: e.status,
        representativeImageUrl: e.representativeImageUrl,
        currentAmount: e.currentAmount,
        targetAmount: e.targetAmount,
        endDate: e.endDate,
      })),
    [data],
  )
  return (
    <ListBody
      cards={cards}
      isPending={isPending}
      error={error ? toErrorMessage(error) : null}
      emptyText="관심 등록한 이벤트가 없어요."
      onOpenEvent={onOpenEvent}
    />
  )
}

function OperatingPanel({ onOpenEvent }: { onOpenEvent: (eventId: number) => void }) {
  const { data, isPending, error } = useOperatingEvents()
  const cards = useMemo<MyEventCard[]>(
    () =>
      (data?.content ?? []).map((e) => ({
        eventId: e.eventId,
        title: e.title,
        category: e.category,
        status: e.status,
        representativeImageUrl: e.representativeImageUrl,
        currentAmount: e.currentAmount,
        targetAmount: e.targetAmount,
        endDate: e.endDate,
      })),
    [data],
  )
  return (
    <ListBody
      cards={cards}
      isPending={isPending}
      error={error ? toErrorMessage(error) : null}
      emptyText="운영중인 이벤트가 없어요."
      onOpenEvent={onOpenEvent}
    />
  )
}

/** 목록 본문 — 로딩·에러·빈 상태·카드 리스트를 공통 처리. */
function ListBody({
  cards,
  isPending,
  error,
  emptyText,
  onOpenEvent,
}: {
  cards: MyEventCard[]
  isPending: boolean
  error: string | null
  emptyText: string
  onOpenEvent: (eventId: number) => void
}) {
  if (error) return <ErrorBanner message={error} />
  if (isPending) return <EmptyState text="불러오는 중…" />
  if (cards.length === 0) return <EmptyState text={emptyText} />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {cards.map((c) => (
        <EventCard key={c.eventId} card={c} onClick={() => onOpenEvent(c.eventId)} />
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '40px 16px',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 1.5,
        letterSpacing: '-0.02em',
        color: '#86869f',
        boxShadow: '0 0 8px rgba(21,21,21,0.04)',
      }}
    >
      {text}
    </div>
  )
}

/** 이벤트 카드 — EventListPage 카드와 동일한 시각(상태 필·모금률·모금액). */
function EventCard({ card, onClick }: { card: MyEventCard; onClick: () => void }) {
  const pill = statusPill(card)
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 12,
        background: '#fff',
        border: 'none',
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: '0 0 8px rgba(21,21,21,0.04)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {card.representativeImageUrl ? (
        <img
          src={card.representativeImageUrl}
          alt=""
          aria-hidden
          style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            width: 72,
            height: 72,
            borderRadius: 8,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ffe1ec 0%, #dcd6f7 100%)',
          }}
        >
          <img
            src={categoryImage(card.category) ?? '/categories/gift.png'}
            alt=""
            width={44}
            height={44}
            style={{ objectFit: 'contain' }}
          />
        </span>
      )}

      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <span
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 24,
              background: pill.bg,
              color: pill.color,
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.5,
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: pill.dot }} />
            {pill.label}
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1.5,
              letterSpacing: '-0.02em',
              color: '#0c0d0d',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {card.title}
          </span>
        </span>
        <span style={{ display: 'flex', gap: 13, fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em' }}>
          <span style={{ display: 'flex', gap: 4 }}>
            <span style={{ color: 'var(--color-accent)' }}>{fundingPercent(card.currentAmount, card.targetAmount)}%</span>
            <span style={{ color: '#5c5c72' }}>달성</span>
          </span>
          <span style={{ display: 'flex', gap: 4, minWidth: 0 }}>
            <span style={{ color: 'var(--color-accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {won(card.currentAmount)}원
            </span>
            <span style={{ color: '#5c5c72', flexShrink: 0 }}>모금</span>
          </span>
        </span>
      </span>
    </button>
  )
}

/** 카드 상태 필: 진행중(보라) · 마감임박(연보라) · 완료(회색) · 무산/취소(회색+빨강). */
function statusPill(c: MyEventCard): { label: string; bg: string; color: string; dot: string } {
  if (c.status === 'ONGOING') {
    const closing = new Date(c.endDate).getTime() <= Date.now() + CLOSING_DAYS * 24 * 60 * 60 * 1000
    return closing
      ? { label: '마감 임박', bg: '#e3e1ff', color: 'var(--color-accent)', dot: 'var(--color-accent)' }
      : { label: '진행중', bg: 'var(--color-accent)', color: '#fff', dot: '#fff' }
  }
  if (c.status === 'COMPLETED') return { label: '완료', bg: '#f6f6fa', color: '#a4a4bd', dot: '#a4a4bd' }
  if (c.status === 'FAILED') return { label: '무산', bg: '#f6f6fa', color: '#e03e3e', dot: '#e03e3e' }
  return { label: '취소', bg: '#f6f6fa', color: '#e03e3e', dot: '#e03e3e' }
}
