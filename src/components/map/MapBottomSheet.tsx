import { useMemo, useRef, useState } from 'react'
import { Flame, Heart, MapPin } from 'lucide-react'
import { categoryMeta } from '@/lib/mapPin'
import { categoryLabel } from '@/types/event'
import type { EventListItem, ViewportEvent } from '@/types/event'

type SheetTab = 'nearby' | 'trend'

/** 탭 공통 카드 데이터 — 주변(viewport)·전국(목록) 응답을 하나로 정규화 */
interface TopEventCard {
  eventId: number
  title: string
  sub: string
  imageUrl?: string
  category: string
}

interface Props {
  /** 📍 주변 탭 라벨 — 지도 중심의 "시군구 법정동" */
  areaLabel: string
  /** 주변 인기 — viewport 이벤트 (서버가 모금률순 정렬) */
  nearby: ViewportEvent[]
  /** 전국 트렌드 — 진행중 목록을 모금률순 정렬한 것 */
  trending: EventListItem[]
  pending: boolean
  onSelectEvent: (eventId: number) => void
}

const TOP_N = 10
/** 하단 네비 높이 — 시트가 네비 뒤까지 내려가므로 그만큼 높이/패딩을 더한다 */
const NAV_CLEARANCE = 'calc(72px + env(safe-area-inset-bottom))'
/** 접힘 상태에서 네비 위로 보이는 높이 */
const PEEK = 306

/**
 * 지도 하단 TOP 10 바텀시트.
 * 접힘: 탭 + 가로 스크롤 카드 / 펼침: 2열 그리드 리스트. 핸들 탭·스와이프로 전환.
 */
export default function MapBottomSheet({ areaLabel, nearby, trending, pending, onSelectEvent }: Props) {
  const [tab, setTab] = useState<SheetTab>('nearby')
  const [expanded, setExpanded] = useState(false)
  const [liked, setLiked] = useState<Set<number>>(new Set())
  const touchStartY = useRef<number | null>(null)

  // 달성률(%)은 카드에 노출하지 않는다 — 누르면 지도 선택 카드/말풍선에서 확인.
  const cards: TopEventCard[] = useMemo(() => {
    if (tab === 'nearby') {
      return nearby.slice(0, TOP_N).map((e) => ({
        eventId: e.eventId,
        title: e.title,
        sub: categoryLabel(e.category),
        category: e.category,
      }))
    }
    return trending.slice(0, TOP_N).map((e) => ({
      eventId: e.eventId,
      title: e.title,
      sub: `${e.siDo} ${e.siGunGu}`,
      imageUrl: e.representativeImageUrl || undefined,
      category: e.category,
    }))
  }, [tab, nearby, trending])

  const toggleLike = (eventId: number) => {
    setLiked((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }

  const title = tab === 'nearby' ? '현재 주변 인기 이벤트 TOP 10' : '현재 전국 인기 이벤트 TOP 10'

  return (
    <section
      aria-label="인기 이벤트"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: expanded ? '84dvh' : `calc(${PEEK}px + ${NAV_CLEARANCE})`,
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -4px 20px rgba(0,0,0,.12)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'height .28s ease',
        pointerEvents: 'auto',
      }}
    >
      {/* 핸들 + 탭 — 탭/스와이프로 펼침 전환 */}
      <div
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY
        }}
        onTouchEnd={(e) => {
          const start = touchStartY.current
          touchStartY.current = null
          if (start === null) return
          const delta = e.changedTouches[0].clientY - start
          if (delta < -30) setExpanded(true)
          else if (delta > 30) setExpanded(false)
        }}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? '시트 접기' : '시트 펼치기'}
          aria-expanded={expanded}
          style={{
            all: 'unset',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            padding: '10px 0 6px',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ width: 40, height: 4, borderRadius: 999, background: '#e0e2e6' }} />
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '4px 20px 0' }}>
          <TabChip
            icon={<MapPin size={13} strokeWidth={2.4} />}
            label={areaLabel}
            active={tab === 'nearby'}
            onClick={() => setTab('nearby')}
          />
          <TabChip
            icon={<Flame size={13} strokeWidth={2.4} />}
            label="전국 트렌드"
            active={tab === 'trend'}
            onClick={() => setTab('trend')}
          />
        </div>
      </div>

      <h2
        style={{
          margin: '14px 20px 12px',
          fontSize: 15.5,
          fontWeight: 700,
          color: '#191f28',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>

      {/* 접힘: 가로 스크롤 / 펼침: 2열 그리드 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: expanded ? 'auto' : 'hidden',
          overflowX: expanded ? 'hidden' : 'auto',
          padding: expanded ? `0 20px calc(16px + ${NAV_CLEARANCE})` : `0 20px calc(12px + ${NAV_CLEARANCE})`,
          display: expanded ? 'grid' : 'flex',
          gridTemplateColumns: expanded ? 'repeat(2, 1fr)' : undefined,
          gap: expanded ? '22px 16px' : 12,
          alignContent: expanded ? 'start' : undefined,
        }}
      >
        {pending && cards.length === 0 && [0, 1, 2].map((i) => <CardSkeleton key={i} expanded={expanded} />)}

        {!pending && cards.length === 0 && (
          <span style={{ fontSize: 13.5, color: '#8b95a1', padding: '8px 0' }}>
            아직 인기 이벤트가 없어요.
          </span>
        )}

        {cards.map((card, i) => (
          <EventTopCard
            key={card.eventId}
            rank={i + 1}
            card={card}
            expanded={expanded}
            liked={liked.has(card.eventId)}
            onToggleLike={() => toggleLike(card.eventId)}
            onClick={() => onSelectEvent(card.eventId)}
          />
        ))}
      </div>
    </section>
  )
}

function TabChip({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '9px 15px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        color: active ? '#fff' : '#333d4b',
        background: active ? '#5b6270' : '#fff',
        border: `1px solid ${active ? '#5b6270' : '#ececf0'}`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function EventTopCard({
  rank,
  card,
  expanded,
  liked,
  onToggleLike,
  onClick,
}: {
  rank: number
  card: TopEventCard
  expanded: boolean
  liked: boolean
  onToggleLike: () => void
  onClick: () => void
}) {
  const meta = categoryMeta(card.category)
  return (
    <div style={{ width: expanded ? 'auto' : 148, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        type="button"
        onClick={onClick}
        aria-label={`${rank}위 ${card.title}`}
        style={{
          all: 'unset',
          boxSizing: 'border-box',
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 12,
          background: '#f1f3f5',
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          meta.emoji
        )}
        <span
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#fff',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13.5,
            fontWeight: 600,
            color: '#191f28',
          }}
        >
          {rank}
        </span>
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span
            style={{
              fontSize: expanded ? 15 : 13.5,
              fontWeight: 600,
              color: '#191f28',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {card.title}
          </span>
          <span
            style={{
              fontSize: expanded ? 13 : 12,
              color: '#8b95a1',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {card.sub}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleLike}
          aria-label={liked ? '찜 해제' : '찜하기'}
          aria-pressed={liked}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: 2,
            color: liked ? '#ff4d6d' : '#191f28',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Heart size={expanded ? 20 : 17} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  )
}

function CardSkeleton({ expanded }: { expanded: boolean }) {
  return (
    <div style={{ width: expanded ? 'auto' : 148, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 12, background: '#f1f3f5' }} />
      <div style={{ height: 14, width: '70%', borderRadius: 6, background: '#f1f3f5' }} />
    </div>
  )
}
