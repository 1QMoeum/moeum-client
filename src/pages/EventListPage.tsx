import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, AlertCircle } from 'lucide-react'
import { useEventList } from '@/hooks/events'
import { useAuthStore } from '@/store/auth'
import { categoryMeta } from '@/lib/mapPin'
import { EVENT_CATEGORIES, categoryLabel } from '@/types/event'
import BottomNav from '@/components/ui/BottomNav'
import type { EventListItem, EventStatus } from '@/types/event'

type StatusFilter = { key: string; label: string; status?: EventStatus }

const STATUS_TABS: StatusFilter[] = [
  { key: 'all', label: '전체' },
  { key: 'ongoing', label: '진행중', status: 'ONGOING' },
  { key: 'history', label: '히스토리', status: 'COMPLETED' },
]

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  ONGOING: { label: '진행중', color: '#12b886' },
  COMPLETED: { label: '종료', color: '#868e96' },
  CANCELLED: { label: '취소', color: '#e03e3e' },
  PENDING_DELETION: { label: '삭제 예정', color: '#e03e3e' },
}

/**
 * 이벤트 탐색(목록). GET /v1/events 를 status·category 로 서버 필터링해 카드로 보여준다.
 * 검색어는 클라이언트에서 제목 필터. (페이지네이션은 size 를 넉넉히 받아 단순화)
 */
export default function EventListPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [statusKey, setStatusKey] = useState('all')

  const status = STATUS_TABS.find((t) => t.key === statusKey)?.status
  const { data, isPending, error } = useEventList(
    { status, category: category ?? undefined, size: 50 },
    !!accessToken,
  )

  const filtered = useMemo(() => {
    const content = data?.content ?? []
    const q = query.trim().toLowerCase()
    return q === '' ? content : content.filter((e) => e.title.toLowerCase().includes(q))
  }, [data, query])

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '8px 20px calc(96px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          boxSizing: 'border-box',
        }}
      >
        {/* 상단 바 */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 8 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로"
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 12,
              cursor: 'pointer',
              color: '#191f28',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={26} />
          </button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#191f28', letterSpacing: '-0.02em' }}>
            이벤트 탐색
          </h1>
        </header>

        <h2 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: '#191f28', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          원하는 이벤트를
          <br />
          찾아보세요
        </h2>

        {/* 검색 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '13px 16px',
            background: '#f5f5f7',
            borderRadius: 999,
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이벤트명, 아티스트, 키워드 검색"
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14.5,
              color: '#191f28',
              letterSpacing: '-0.01em',
            }}
          />
          <Search size={20} strokeWidth={2.2} color="#adb5bd" style={{ flexShrink: 0 }} />
        </div>

        {/* 카테고리 */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28', letterSpacing: '-0.01em' }}>
            카테고리
          </span>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            <CategoryCircle label="전체" emoji="✨" active={category === null} onClick={() => setCategory(null)} />
            {EVENT_CATEGORIES.map((c) => {
              const meta = categoryMeta(c.value)
              return (
                <CategoryCircle
                  key={c.value}
                  label={c.label}
                  emoji={meta.emoji}
                  active={category === c.value}
                  onClick={() => setCategory(c.value)}
                />
              )
            })}
          </div>
        </section>

        {/* 전체 이벤트 */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#191f28', letterSpacing: '-0.01em' }}>
            전체 이벤트
          </span>

          <div style={{ display: 'flex', gap: 8 }}>
            {STATUS_TABS.map((t) => {
              const active = statusKey === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setStatusKey(t.key)}
                  style={{
                    all: 'unset',
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontSize: 13.5,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    cursor: 'pointer',
                    color: active ? '#fff' : '#8b95a1',
                    background: active ? '#191f28' : '#f5f5f7',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {isPending && <ListSkeleton />}

          {!isPending && error && (
            <EmptyNote icon={<AlertCircle size={28} color="#e03e3e" />} text={`${error.message} (${error.status ?? '?'})`} />
          )}

          {!isPending && !error && filtered.length === 0 && (
            <EmptyNote text="조건에 맞는 이벤트가 없어요." />
          )}

          {!isPending &&
            !error &&
            filtered.map((e) => (
              <EventCard key={e.eventId} event={e} onClick={() => navigate(`/events/${e.eventId}`)} />
            ))}
        </section>
      </div>

      <BottomNav onCreate={() => navigate('/events/new')} />
    </main>
  )
}

function CategoryCircle({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string
  emoji: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        flexShrink: 0,
        width: 64,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          background: active ? '#f3f0ff' : '#f1f3f5',
          border: `2px solid ${active ? '#8B5CF6' : 'transparent'}`,
        }}
      >
        {emoji}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: active ? 700 : 500,
          color: active ? '#191f28' : '#6b7684',
          letterSpacing: '-0.01em',
          maxWidth: 64,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </button>
  )
}

function EventCard({ event, onClick }: { event: EventListItem; onClick: () => void }) {
  const meta = categoryMeta(event.category)
  const badge = STATUS_BADGE[event.status] ?? { label: event.status, color: '#868e96' }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 12,
        border: '1px solid #ededf2',
        borderRadius: 16,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 12,
          background: '#f1f3f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {event.representativeImageUrl ? (
          <img src={event.representativeImageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          meta.emoji
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 700,
            color: badge.color,
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: badge.color }} />
          {badge.label}
          <span style={{ color: '#c5c8ce', fontWeight: 500 }}>· {categoryLabel(event.category)}</span>
        </span>
        <span
          style={{
            fontSize: 15.5,
            fontWeight: 700,
            color: '#191f28',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {event.title}
        </span>
        <span style={{ fontSize: 13, color: '#6b7684', letterSpacing: '-0.01em' }}>
          <b style={{ color: meta.color }}>{event.fundingRate}%</b> 달성 · {event.siDo} {event.siGunGu}
        </span>
      </div>
      <ChevronRight size={20} color="#c5c8ce" style={{ flexShrink: 0 }} />
    </button>
  )
}

function ListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 96, borderRadius: 16, background: '#f1f3f5' }} />
      ))}
    </div>
  )
}

function EmptyNote({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      {icon}
      <span style={{ fontSize: 14, color: '#8b95a1', letterSpacing: '-0.01em' }}>{text}</span>
    </div>
  )
}
