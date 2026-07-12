import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Flame, Heart, MapPin } from 'lucide-react'
import { mapTokens, pillStyle } from '@/components/map/mapStyle'
import { useBookmarkedIds, useToggleBookmark } from '@/hooks/bookmark'
import { reverseGeocode } from '@/lib/reverseGeocode'
import { categoryImage } from '@/types/event'
import type { EventListItem, ViewportEvent } from '@/types/event'

type SheetTab = 'nearby' | 'trend'

/** 탭 공통 카드 데이터 — 주변(viewport)·전국(목록) 응답을 하나로 정규화 */
interface TopEventCard {
  eventId: number
  title: string
  sub: string
  imageUrl?: string
  category: string
  /** 주변(viewport) 탭 — 좌표를 역지오코딩해 주소를 표시한다 */
  lat?: number
  lng?: number
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
/** 하단 네비 높이 — 시트가 네비 뒤까지 내려가므로 그만큼 콘텐츠 여백을 더한다 */
const NAV_CLEARANCE = 'calc(72px + env(safe-area-inset-bottom))'
/** 접힘 상태에서 화면 하단부터 보이는 시트 높이(px) — 핸들+토글+타이틀+카드 상단 살짝 */
const PEEK = 290
/** 펼침 상태 시트 높이 (뷰포트 비율) */
const EXPANDED_RATIO = 0.86
/** 드래그로 인식하기 시작하는 최소 이동량(px) — 이보다 작으면 칩 탭으로 취급 */
const DRAG_THRESHOLD = 4

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/**
 * 지도 하단 TOP 10 바텀시트.
 * 콘텐츠는 접힘/펼침 모두 2열 그리드로 동일하고, 핸들·헤더를 잡아 손가락을 따라
 * 부드럽게 드래그한다(translateY). 놓으면 위치·속도로 접힘/펼침에 스냅한다.
 */
export default function MapBottomSheet({ areaLabel, nearby, trending, pending, onSelectEvent }: Props) {
  const [tab, setTab] = useState<SheetTab>('nearby')
  const [expanded, setExpanded] = useState(false)

  // 찜(관심 이벤트) — 서버 관심 목록으로 초기 상태를 맞추고, 토글은 낙관적 갱신 후 mutation.
  const bookmarkedIds = useBookmarkedIds()
  const toggleBookmark = useToggleBookmark()
  const [liked, setLiked] = useState<Set<number>>(new Set())
  useEffect(() => {
    setLiked(new Set(bookmarkedIds))
  }, [bookmarkedIds])

  // 뷰포트 높이 → 펼침 높이·접힘 오프셋 계산 (회전/리사이즈 대응)
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight))
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const expandedH = Math.round(vh * EXPANDED_RATIO)
  const collapsedY = Math.max(0, expandedH - PEEK)

  // 드래그 중 실시간 translateY (null 이면 스냅 상태 = 트랜지션 on)
  const [dragY, setDragY] = useState<number | null>(null)
  const drag = useRef<{ startPointer: number; base: number; active: boolean; lastY: number; lastT: number; v: number } | null>(null)

  const targetY = expanded ? 0 : collapsedY
  const displayY = dragY ?? targetY

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = {
      startPointer: e.clientY,
      base: targetY,
      active: false,
      lastY: e.clientY,
      lastT: e.timeStamp,
      v: 0,
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const delta = e.clientY - d.startPointer
    if (!d.active) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return // 아직 탭인지 드래그인지 미정
      d.active = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    // 순간 속도(px/ms) — 놓을 때 플릭 판정용
    const dt = e.timeStamp - d.lastT
    if (dt > 0) d.v = (e.clientY - d.lastY) / dt
    d.lastY = e.clientY
    d.lastT = e.timeStamp
    setDragY(clamp(d.base + delta, 0, collapsedY))
  }
  const endDrag = () => {
    const d = drag.current
    drag.current = null
    if (!d || !d.active || dragY === null) {
      setDragY(null)
      return
    }
    // 플릭(빠른 스와이프)이면 방향 우선, 아니면 위치 절반 기준 스냅
    let next: boolean
    if (d.v < -0.45) next = true
    else if (d.v > 0.45) next = false
    else next = dragY < collapsedY * 0.5
    setExpanded(next)
    setDragY(null)
  }

  const dragging = dragY !== null

  // 달성률(%)은 카드에 노출하지 않는다 — 누르면 지도 핀 팝업에서 확인.
  const cards: TopEventCard[] = useMemo(() => {
    if (tab === 'nearby') {
      return nearby.slice(0, TOP_N).map((e) => ({
        eventId: e.eventId,
        title: e.title,
        sub: '',
        imageUrl: e.representativeImageUrl || undefined,
        category: e.category,
        lat: e.latitude,
        lng: e.longitude,
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
    const next = !liked.has(eventId)
    setLiked((prev) => {
      const updated = new Set(prev)
      if (next) updated.add(eventId)
      else updated.delete(eventId)
      return updated
    })
    toggleBookmark.mutate(
      { eventId, next },
      {
        onError: () =>
          setLiked((prev) => {
            const rolled = new Set(prev)
            if (next) rolled.delete(eventId)
            else rolled.add(eventId)
            return rolled
          }),
      },
    )
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
        height: expandedH,
        transform: `translateY(${displayY}px)`,
        transition: dragging ? 'none' : 'transform .34s cubic-bezier(.22,1,.36,1)',
        background: mapTokens.white,
        borderRadius: '24px 24px 0 0',
        boxShadow: mapTokens.sheetShadow,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        willChange: 'transform',
        touchAction: 'none',
      }}
    >
      {/* 핸들 + 토글 — 이 영역을 잡아 드래그 (탭은 펼침 토글) */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ flexShrink: 0, touchAction: 'none' }}
      >
        <button
          type="button"
          onClick={() => !dragging && setExpanded((v) => !v)}
          aria-label={expanded ? '시트 접기' : '시트 펼치기'}
          aria-expanded={expanded}
          style={{
            all: 'unset',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            padding: '12px 0 8px',
            cursor: 'grab',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ width: 42, height: 4, borderRadius: 999, background: '#e5e5ec' }} />
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '4px 20px 2px' }}>
          <TabChip
            icon={<MapPin size={14} strokeWidth={2.4} />}
            label={areaLabel}
            active={tab === 'nearby'}
            onClick={() => setTab('nearby')}
          />
          <TabChip
            icon={<Flame size={14} strokeWidth={2.4} />}
            label="전국 트렌드"
            active={tab === 'trend'}
            onClick={() => setTab('trend')}
          />
        </div>
      </div>

      <h2
        style={{
          flexShrink: 0,
          margin: '16px 20px 12px',
          fontSize: 16,
          fontWeight: 700,
          color: mapTokens.gray900,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h2>

      {/* 2열 그리드 — 펼침일 때만 스크롤 (접힘 상태 스크롤/드래그 충돌 방지) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: expanded && !dragging ? 'auto' : 'hidden',
          overflowX: 'hidden',
          padding: `0 20px calc(20px + ${NAV_CLEARANCE})`,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '22px 16px',
          alignContent: 'start',
          touchAction: expanded ? 'pan-y' : 'none',
        }}
      >
        {pending && cards.length === 0 && [0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}

        {!pending && cards.length === 0 && (
          <span style={{ gridColumn: '1 / -1', fontSize: 14, color: mapTokens.gray500, padding: '8px 0' }}>
            아직 인기 이벤트가 없어요.
          </span>
        )}

        {cards.map((card, i) => (
          <EventTopCard
            key={card.eventId}
            rank={i + 1}
            card={card}
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
    <button type="button" onClick={onClick} aria-pressed={active} style={pillStyle(active)}>
      {icon}
      {label}
    </button>
  )
}

function EventTopCard({
  rank,
  card,
  liked,
  onToggleLike,
  onClick,
}: {
  rank: number
  card: TopEventCard
  liked: boolean
  onToggleLike: () => void
  onClick: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          borderRadius: 16,
          background: mapTokens.gray100,
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {card.imageUrl ? (
          <img src={card.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <img
            src={categoryImage(card.category) ?? '/categories/gift.png'}
            alt=""
            width={52}
            height={52}
            style={{ objectFit: 'contain' }}
          />
        )}
        <span
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: mapTokens.gray900,
          }}
        >
          {rank}
        </span>
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: mapTokens.gray900,
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {card.title}
          </span>
          <span
            style={{
              fontSize: 14,
              color: mapTokens.gray500,
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <CardSub card={card} />
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
            color: liked ? '#ff4d6d' : mapTokens.gray500,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Heart size={20} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  )
}

/**
 * 좌표 → "시군구 법정동" 주소 라벨. 소수 4자리(약 11m)로 반올림한 키로 캐시해
 * 같은 위치의 카드끼리 역지오코딩을 공유한다.
 */
function useRegionLabel(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['regionLabel', lat?.toFixed(4), lng?.toFixed(4)],
    enabled: lat != null && lng != null,
    staleTime: Infinity,
    queryFn: async () => {
      const r = await reverseGeocode(lat as number, lng as number)
      return `${r.siGunGu} ${r.legalDong}`
    },
  })
}

/** 카드 서브라인 — 주변 탭은 좌표 역지오코딩 주소, 전국 탭은 서버 주소(siDo siGunGu). */
function CardSub({ card }: { card: TopEventCard }) {
  const { data } = useRegionLabel(card.lat, card.lng)
  if (card.lat == null) return <>{card.sub}</>
  return <>{data ?? '…'}</>
}

function CardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 16, background: mapTokens.gray100 }} />
      <div style={{ height: 14, width: '70%', borderRadius: 6, background: mapTokens.gray100 }} />
    </div>
  )
}
