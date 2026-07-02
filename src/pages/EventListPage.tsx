import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X, AlertCircle } from 'lucide-react'
import { useEventList } from '@/hooks/events'
import { useAuthStore } from '@/store/auth'
import { categoryMeta } from '@/lib/mapPin'
import { EVENT_CATEGORIES } from '@/types/event'
import BottomNav from '@/components/ui/BottomNav'
import type { EventListItem, EventStatus } from '@/types/event'

/** 진행 상태 필터. 마감임박(closing)은 서버 ONGOING + 클라이언트 7일 필터. */
type StatusKey = 'all' | 'ongoing' | 'closing' | 'history'
/** 정렬 기준 (모두 클라이언트 정렬 — 서버 기본은 최신순). */
type SortKey = 'latest' | 'amount' | 'funding' | 'closing'

const STATUS_TABS: Array<{ key: StatusKey; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'ongoing', label: '진행중' },
  { key: 'history', label: '히스토리' },
]

/** 필터 시트의 진행 상태 칩 (페이지 탭 + 마감 임박). */
const SHEET_STATUS: Array<{ key: StatusKey; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'ongoing', label: '진행중' },
  { key: 'closing', label: '마감 임박' },
  { key: 'history', label: '히스토리' },
]

const SORT_OPTIONS: Array<{ key: SortKey; label: string; desc: string }> = [
  { key: 'latest', label: '최신 순', desc: '새로 등록된 순서' },
  { key: 'amount', label: '모금액 순', desc: '모금액이 많은 순서' },
  { key: 'funding', label: '달성률 순', desc: '달성률이 높은 순서' },
  { key: 'closing', label: '마감임박 순', desc: '마감일이 가까운 순서' },
]

const REGIONS = ['서울', '경기', '인천', '세종', '대전', '대구', '부산', '울산', '광주', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

/** 마감 임박 기준 — 종료일까지 7일 이내 */
const CLOSING_DAYS = 7

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  ONGOING: { label: '진행중', color: '#12b886', bg: '#e6f9f2' },
  COMPLETED: { label: '종료', color: '#868e96', bg: '#f1f3f5' },
  CANCELLED: { label: '취소', color: '#e03e3e', bg: '#ffecec' },
  PENDING_DELETION: { label: '삭제 예정', color: '#e03e3e', bg: '#ffecec' },
}

/** 추천 검색어 — 검색 API 가 없어 카테고리·대표 키워드 고정 목록. */
const SUGGESTED_KEYWORDS = ['생일카페', '카페', '지하철', '전광판', '현수막', '커피차', '버스', '온라인']

const RECENT_KEY = 'moeum.recentSearches'
const RECENT_MAX = 10

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function saveRecent(list: string[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)))
}

/**
 * 이벤트 탐색(목록). GET /v1/events 를 status·category 로 서버 필터링해 카드로 보여준다.
 * 검색어·지역·정렬은 클라이언트 처리(검색 API 없음). 검색창 탭 → 검색어 입력 화면,
 * 필터 아이콘 → 지역·진행 상태·정렬 바텀시트.
 */
export default function EventListPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [category, setCategory] = useState<string | null>(null)
  const [statusKey, setStatusKey] = useState<StatusKey>('all')
  const [sortKey, setSortKey] = useState<SortKey>('latest')
  const [region, setRegion] = useState<string | null>(null)

  const serverStatus: EventStatus | undefined =
    statusKey === 'ongoing' || statusKey === 'closing'
      ? 'ONGOING'
      : statusKey === 'history'
        ? 'COMPLETED'
        : undefined
  const { data, isPending, error } = useEventList(
    { status: serverStatus, category: category ?? undefined, size: 50 },
    !!accessToken,
  )

  const filtered = useMemo(() => {
    let list = data?.content ?? []
    const q = query.trim().toLowerCase()
    if (q !== '') list = list.filter((e) => e.title.toLowerCase().includes(q))
    if (region) list = list.filter((e) => e.siDo?.startsWith(region))
    if (statusKey === 'closing') {
      const limit = Date.now() + CLOSING_DAYS * 24 * 60 * 60 * 1000
      list = list.filter((e) => new Date(e.endDate).getTime() <= limit)
    }
    switch (sortKey) {
      case 'amount':
        return [...list].sort((a, b) => b.currentAmount - a.currentAmount)
      case 'funding':
        return [...list].sort((a, b) => b.fundingRate - a.fundingRate)
      case 'closing':
        return [...list].sort((a, b) => a.endDate.localeCompare(b.endDate))
      default:
        return list
    }
  }, [data, query, region, statusKey, sortKey])

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  if (searchOpen) {
    return (
      <SearchScreen
        initial={query}
        onClose={() => setSearchOpen(false)}
        onSubmit={(q) => {
          setQuery(q)
          setSearchOpen(false)
        }}
      />
    )
  }

  const searching = query.trim() !== ''
  const filterActive = region !== null || sortKey !== 'latest' || statusKey === 'closing'

  return (
    <main style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '8px 20px calc(110px + env(safe-area-inset-bottom))',
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#191f28', letterSpacing: '-0.02em' }}>
            이벤트 탐색
          </h1>
        </header>

        {!searching && (
          <h2 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: '#191f28', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            원하는 이벤트를
            <br />
            찾아보세요
          </h2>
        )}

        {/* 검색바 — 탭하면 검색어 입력 화면 */}
        <div
          role="search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '13px 16px',
            background: '#f5f5f7',
            borderRadius: 999,
          }}
        >
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="이벤트 검색"
            style={{
              all: 'unset',
              flex: 1,
              minWidth: 0,
              fontSize: 14.5,
              cursor: 'pointer',
              color: searching ? '#191f28' : '#adb5bd',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {searching ? query : '이벤트명, 아티스트, 키워드 검색'}
          </button>
          {searching && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="검색어 지우기"
              style={{
                all: 'unset',
                display: 'flex',
                cursor: 'pointer',
                color: '#adb5bd',
                padding: 2,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          )}
          <Search size={20} strokeWidth={2.2} color="#adb5bd" style={{ flexShrink: 0 }} />
        </div>

        {/* 카테고리 — 검색 결과 화면에서는 숨김 */}
        {!searching && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#191f28', letterSpacing: '-0.01em' }}>
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
        )}

        {/* 목록 + 상태 탭 + 필터 */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!searching && (
            <span style={{ fontSize: 15, fontWeight: 600, color: '#191f28', letterSpacing: '-0.01em' }}>
              전체 이벤트
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {STATUS_TABS.map((t) => {
              const active = statusKey === t.key || (t.key === 'ongoing' && statusKey === 'closing')
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setStatusKey(t.key)}
                  aria-pressed={active}
                  style={{
                    all: 'unset',
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontSize: 13.5,
                    fontWeight: 600,
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
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-label="필터"
              style={{
                all: 'unset',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 12,
                cursor: 'pointer',
                color: filterActive ? '#7c6ff0' : '#4e5968',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <SlidersHorizontal size={19} strokeWidth={2.2} />
            </button>
          </div>

          {isPending && <ListSkeleton />}

          {!isPending && error && (
            <EmptyNote icon={<AlertCircle size={28} color="#e03e3e" />} text={`${error.message} (${error.status ?? '?'})`} />
          )}

          {!isPending && !error && filtered.length === 0 && (
            <EmptyNote text={searching ? `'${query}' 검색 결과가 없어요.` : '조건에 맞는 이벤트가 없어요.'} />
          )}

          {!isPending &&
            !error &&
            filtered.map((e) => (
              <EventCard key={e.eventId} event={e} onClick={() => navigate(`/events/${e.eventId}`)} />
            ))}
        </section>
      </div>

      {filterOpen && (
        <FilterSheet
          region={region}
          statusKey={statusKey}
          sortKey={sortKey}
          onRegion={setRegion}
          onStatus={setStatusKey}
          onSort={setSortKey}
          onClose={() => setFilterOpen(false)}
        />
      )}

      <BottomNav onCreate={() => navigate('/events/new')} />
    </main>
  )
}

/** 검색어 입력 화면 — 최근 검색어(localStorage) + 추천 검색어. */
function SearchScreen({
  initial,
  onClose,
  onSubmit,
}: {
  initial: string
  onClose: () => void
  onSubmit: (query: string) => void
}) {
  const [text, setText] = useState(initial)
  const [recent, setRecent] = useState<string[]>(loadRecent)

  const submit = (raw: string) => {
    const q = raw.trim()
    if (q === '') return
    const next = [q, ...recent.filter((r) => r !== q)]
    setRecent(next)
    saveRecent(next)
    onSubmit(q)
  }

  const removeRecent = (word: string) => {
    const next = recent.filter((r) => r !== word)
    setRecent(next)
    saveRecent(next)
  }

  const clearRecent = () => {
    setRecent([])
    saveRecent([])
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fff' }}>
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '8px 20px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          boxSizing: 'border-box',
        }}
      >
        {/* 검색 입력 */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(text)
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8 }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="뒤로"
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              cursor: 'pointer',
              color: '#191f28',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={25} />
          </button>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              background: '#f5f5f7',
              borderRadius: 999,
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="이벤트명, 아티스트, 키워드 검색"
              autoFocus
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
            <button
              type="submit"
              aria-label="검색"
              style={{ all: 'unset', display: 'flex', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
            >
              <Search size={20} strokeWidth={2.2} color="#adb5bd" />
            </button>
          </div>
        </form>

        {/* 최근 검색어 */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#191f28', letterSpacing: '-0.01em' }}>
              최근 검색어
            </span>
            {recent.length > 0 && (
              <button
                type="button"
                onClick={clearRecent}
                style={{
                  all: 'unset',
                  fontSize: 13,
                  color: '#8b95a1',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                전체삭제
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <span style={{ fontSize: 13.5, color: '#adb5bd', textAlign: 'center', padding: '8px 0' }}>
              최근 검색어가 없습니다.
            </span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recent.map((word) => (
                <span
                  key={word}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 999,
                    border: '1px solid #ececf0',
                    fontSize: 13,
                    color: '#4e5968',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => submit(word)}
                    style={{ all: 'unset', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                  >
                    {word}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecent(word)}
                    aria-label={`${word} 삭제`}
                    style={{ all: 'unset', display: 'flex', cursor: 'pointer', color: '#c5c8ce', WebkitTapHighlightColor: 'transparent' }}
                  >
                    <X size={13} strokeWidth={2.4} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* 추천 검색어 */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#191f28', letterSpacing: '-0.01em' }}>
            추천 검색어
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTED_KEYWORDS.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => submit(word)}
                style={{
                  all: 'unset',
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: '#f5f5f7',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#4e5968',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {word}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

/** 필터 바텀시트 — 지역·진행 상태 칩 + 정렬 라디오. 변경 즉시 적용, 딤 탭으로 닫기. */
function FilterSheet({
  region,
  statusKey,
  sortKey,
  onRegion,
  onStatus,
  onSort,
  onClose,
}: {
  region: string | null
  statusKey: StatusKey
  sortKey: SortKey
  onRegion: (r: string | null) => void
  onStatus: (s: StatusKey) => void
  onSort: (s: SortKey) => void
  onClose: () => void
}) {
  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        all: 'unset',
        flexShrink: 0,
        padding: '8px 15px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        color: active ? '#fff' : '#8b95a1',
        background: active ? '#191f28' : '#f5f5f7',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
      {/* 딤 배경 */}
      <button
        type="button"
        onClick={onClose}
        aria-label="필터 닫기"
        style={{
          all: 'unset',
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,.4)',
          cursor: 'pointer',
        }}
      />
      <section
        aria-label="필터"
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 0,
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          padding: '10px 24px calc(28px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="시트 닫기"
          style={{
            all: 'unset',
            display: 'flex',
            justifyContent: 'center',
            padding: '2px 0 0',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ width: 40, height: 4, borderRadius: 999, background: '#e0e2e6' }} />
        </button>

        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: '#191f28', letterSpacing: '-0.02em' }}>
          필터
        </h2>

        {/* 지역 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: '#191f28' }}>지역</span>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {chip('전체', region === null, () => onRegion(null))}
            {REGIONS.map((r) => chip(r, region === r, () => onRegion(r)))}
          </div>
        </div>

        {/* 진행 상태 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: '#191f28' }}>진행 상태</span>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {SHEET_STATUS.map((s) => chip(s.label, statusKey === s.key, () => onStatus(s.key)))}
          </div>
        </div>

        <div style={{ height: 1, background: '#f0f0f3' }} />

        {/* 정렬 기준 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: '#191f28', marginBottom: 8 }}>정렬 기준</span>
          {SORT_OPTIONS.map((opt) => {
            const active = sortKey === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onSort(opt.key)}
                role="radio"
                aria-checked={active}
                style={{
                  all: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 0',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 19,
                    height: 19,
                    borderRadius: '50%',
                    border: active ? '6px solid #7c6ff0' : '1.5px solid #d5d8dd',
                    background: '#fff',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                />
                <span style={{ width: 88, fontSize: 14.5, fontWeight: active ? 600 : 500, color: '#191f28' }}>
                  {opt.label}
                </span>
                <span style={{ fontSize: 13, color: '#a5a1d1' }}>{opt.desc}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
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
          fontWeight: active ? 600 : 500,
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
  const badge = STATUS_BADGE[event.status] ?? { label: event.status, color: '#868e96', bg: '#f1f3f5' }
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
          width: 64,
          height: 64,
          borderRadius: 12,
          background: '#f1f3f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
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
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 999,
              background: badge.bg,
              color: badge.color,
              fontSize: 11.5,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: badge.color }} />
            {badge.label}
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#191f28',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.title}
          </span>
        </span>
        <span style={{ fontSize: 13, color: '#6b7684', letterSpacing: '-0.01em' }}>
          <b style={{ color: '#191f28', fontWeight: 600 }}>{event.fundingRate}% 달성</b>
          {' · '}
          {event.siDo} {event.siGunGu}
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
        <div key={i} style={{ height: 90, borderRadius: 16, background: '#f1f3f5' }} />
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
