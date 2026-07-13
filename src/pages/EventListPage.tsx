import { useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useEventList } from '@/hooks/events'
import { useHomeOnBack } from '@/hooks/useHomeOnBack'
import { useAuthStore } from '@/store/auth'
import BottomNav from '@/components/ui/BottomNav'
import { EVENT_CATEGORIES, categoryImage, fundingPercent, isBeforeFundingStart } from '@/types/event'
import type { EventListItem, EventStatus } from '@/types/event'

/** 진행 상태 필터. 마감임박(closing)은 서버 ONGOING + 클라이언트 7일 필터. */
type StatusKey = 'all' | 'ongoing' | 'closing' | 'history'
/** 정렬 기준 (모두 클라이언트 정렬 — 서버 기본은 최신순). */
type SortKey = 'latest' | 'amount' | 'funding' | 'closing'

/** 필터 시트의 진행 상태 칩 (전체·진행중·마감 임박·히스토리). */
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

/** 탐색 카테고리 — 서버 enum 단일 출처(EVENT_CATEGORIES)에서 파생. server = category 값. */
const DESIGN_CATEGORIES = EVENT_CATEGORIES.map((c) => ({ label: c.label, img: c.img, server: c.value }))

/** 추천 검색어 — 검색 API 가 없어 고정 목록. 접힘 상태에선 앞 7개만 노출. */
const SUGGESTED_KEYWORDS = ['생일카페', '리나', '지하철 광고', '커피차', '진행중', '성수동 카페', '홍대입구역', '전광판', '현수막', '온라인']
const SUGGESTED_COLLAPSED = 7

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

const won = (n: number) => n.toLocaleString('ko-KR')

/**
 * 이벤트 탐색(목록). GET /v1/events 를 status·category 로 서버 필터링해 카드로 보여준다.
 * 검색어·지역·정렬은 클라이언트 처리(검색 API 없음). 검색창 탭 → 검색어 입력 화면,
 * 필터 아이콘 → 지역·진행 상태·정렬 바텀시트, 우하단 AI 코칭 → AI 플래너.
 */
export default function EventListPage() {
  const navigate = useNavigate()
  useHomeOnBack()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [categoryLabel, setCategoryLabel] = useState<string | null>(null)
  const [statusKey, setStatusKey] = useState<StatusKey>('all')
  const [sortKey, setSortKey] = useState<SortKey>('latest')
  const [region, setRegion] = useState<string | null>(null)

  const selectedCategory = DESIGN_CATEGORIES.find((c) => c.label === categoryLabel)
  const serverStatus: EventStatus | undefined =
    statusKey === 'ongoing' || statusKey === 'closing'
      ? 'ONGOING'
      : statusKey === 'history'
        ? 'COMPLETED'
        : undefined
  const { data, isPending, error } = useEventList(
    { status: serverStatus, category: selectedCategory?.server, size: 50 },
    !!accessToken,
  )

  const filtered = useMemo(() => {
    // 모금 시작 전 이벤트는 공개 탐색에 노출하지 않는다 (총대는 마이페이지에서 확인)
    let list = (data?.content ?? []).filter((e) => !isBeforeFundingStart(e.startDate))
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

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100%' }}>
      <main
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '0 0 150px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
          <IconButton label="뒤로가기" onClick={() => navigate('/main')}>
            <BackCaret />
          </IconButton>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#27282c' }}>
            이벤트 탐색
          </h1>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', padding: '22px 20px 0', gap: 32 }}>
          {/* 히어로 + 검색바 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!searching && (
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  letterSpacing: '-0.02em',
                  color: '#0c0d0d',
                }}
              >
                원하는 이벤트를
                <br />
                찾아보세요
              </h2>
            )}

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="이벤트 검색"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 44,
                padding: '0 12px 0 23px',
                background: '#fff',
                border: '1px solid #f6f6fa',
                borderRadius: 32,
                cursor: 'pointer',
                boxShadow: '0 0 8px rgba(21,21,21,0.04)',
                boxSizing: 'border-box',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'left',
                  fontSize: 14,
                  lineHeight: 1.5,
                  letterSpacing: '-0.02em',
                  color: searching ? '#151519' : '#5c5c72',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {searching ? query : '이벤트명, 아티스트, 키워드 검색'}
              </span>
              {searching && (
                <span
                  role="button"
                  aria-label="검색어 지우기"
                  onClick={(e) => {
                    e.stopPropagation()
                    setQuery('')
                  }}
                  style={{ display: 'flex', padding: 4, cursor: 'pointer' }}
                >
                  <XIcon />
                </span>
              )}
              <SearchIcon />
            </button>

            {/* 검색 결과 모드 — 검색바 바로 아래 필터 아이콘 */}
            {searching && <StatusChipRow onFilter={() => setFilterOpen(true)} />}
          </section>

          {/* 카테고리 */}
          {!searching && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionTitle label="카테고리" />
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  margin: '0 -20px',
                  padding: '4px 20px',
                }}
              >
                {DESIGN_CATEGORIES.map((c) => {
                  const active = categoryLabel === c.label
                  return (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => setCategoryLabel(active ? null : c.label)}
                      aria-pressed={active}
                      style={{
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '10px 18px',
                        background: '#fff',
                        border: active ? '1px solid var(--color-accent)' : '1px solid transparent',
                        borderRadius: 12,
                        cursor: 'pointer',
                        boxShadow: '0 0 16px rgba(21,21,21,0.04)',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <img src={c.img} alt="" aria-hidden width={48} height={48} style={{ display: 'block', objectFit: 'contain' }} />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          lineHeight: 1.5,
                          letterSpacing: '-0.02em',
                          color: active ? 'var(--color-accent)' : '#73787e',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* 전체 이벤트 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!searching && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <SectionTitle label="전체 이벤트" />
                <StatusChipRow onFilter={() => setFilterOpen(true)} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isPending &&
                [0, 1, 2].map((i) => (
                  <div key={i} style={{ height: 96, borderRadius: 12, background: '#fff', boxShadow: '0 0 8px rgba(21,21,21,0.04)' }} />
                ))}

              {!isPending && error && (
                <EmptyNote text={`${error.message} (${error.status ?? '?'})`} />
              )}

              {!isPending && !error && filtered.length === 0 && (
                <EmptyNote text={searching ? `'${query}' 검색 결과가 없어요.` : '조건에 맞는 이벤트가 없어요.'} />
              )}

              {!isPending &&
                !error &&
                filtered.map((e) => (
                  <EventCard key={e.eventId} event={e} onClick={() => navigate(`/events/${e.eventId}`)} />
                ))}
            </div>
          </section>
        </div>
      </main>

      {/* AI 코칭 플로팅 버튼 */}
      <button
        type="button"
        onClick={() => navigate('/events/new/ai')}
        aria-label="AI 코칭"
        style={{
          position: 'fixed',
          right: 'max(20px, calc(50% - 220px))',
          bottom: 'calc(104px + env(safe-area-inset-bottom))',
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          zIndex: 9,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* SVG 에셋에 흰 원형 배경·그림자가 포함돼 있어 (108×108, 원 72px) 18px씩 밖으로 흘린다 */}
        <img src="/ai-mascot.svg" alt="" aria-hidden width={108} height={108} style={{ display: 'block', margin: -18, maxWidth: 'none' }} />
      </button>

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
    </div>
  )
}

/** 진행 상태는 필터 시트에서만 다룬다. 밖에는 필터 아이콘만 우측 정렬로 노출. */
function StatusChipRow({ onFilter }: { onFilter: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      <IconButton label="필터" onClick={onFilter}>
        <FilterIcon />
      </IconButton>
    </div>
  )
}

function EventCard({ event, onClick }: { event: EventListItem; onClick: () => void }) {
  const pill = statusPill(event)
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
      {event.representativeImageUrl ? (
        <img
          src={event.representativeImageUrl}
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
            src={categoryImage(event.category) ?? '/categories/gift.png'}
            alt=""
            width={44}
            height={44}
            style={{ objectFit: 'contain' }}
          />
        </span>
      )}

      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
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
              {event.title}
            </span>
          </span>
          <RightCaret />
        </span>
        <span style={{ display: 'flex', gap: 13, fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em' }}>
          <span style={{ display: 'flex', gap: 4 }}>
            <span style={{ color: 'var(--color-accent)' }}>{fundingPercent(event.currentAmount, event.targetAmount)}%</span>
            <span style={{ color: '#5c5c72' }}>달성</span>
          </span>
          <span style={{ display: 'flex', gap: 4, minWidth: 0 }}>
            <span style={{ color: 'var(--color-accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {won(event.currentAmount)}원
            </span>
            <span style={{ color: '#5c5c72', flexShrink: 0 }}>모금</span>
          </span>
        </span>
      </span>
    </button>
  )
}

/** 카드 상태 필: 진행중(보라) · 마감임박(연보라) · 완료(회색) · 취소(회색+빨강). */
function statusPill(e: EventListItem): { label: string; bg: string; color: string; dot: string } {
  if (e.status === 'ONGOING') {
    const closing = new Date(e.endDate).getTime() <= Date.now() + CLOSING_DAYS * 24 * 60 * 60 * 1000
    return closing
      ? { label: '마감 임박', bg: '#e3e1ff', color: 'var(--color-accent)', dot: 'var(--color-accent)' }
      : { label: '진행중', bg: 'var(--color-accent)', color: '#fff', dot: '#fff' }
  }
  if (e.status === 'COMPLETED') return { label: '완료', bg: '#f6f6fa', color: '#a4a4bd', dot: '#a4a4bd' }
  if (e.status === 'FAILED') return { label: '무산', bg: '#f6f6fa', color: '#e03e3e', dot: '#e03e3e' }
  return { label: '취소', bg: '#f6f6fa', color: '#e03e3e', dot: '#e03e3e' }
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
  const [expanded, setExpanded] = useState(false)

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

  const suggested = expanded ? SUGGESTED_KEYWORDS : SUGGESTED_KEYWORDS.slice(0, SUGGESTED_COLLAPSED)

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100%' }}>
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 40px', boxSizing: 'border-box' }}>
        {/* 검색 입력 */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(text)
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}
        >
          <IconButton label="뒤로가기" onClick={onClose}>
            <BackCaret />
          </IconButton>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              padding: '0 12px 0 23px',
              background: '#fff',
              border: '1px solid #f6f6fa',
              borderRadius: 32,
              boxShadow: '0 0 8px rgba(21,21,21,0.04)',
              boxSizing: 'border-box',
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
                fontSize: 14,
                letterSpacing: '-0.02em',
                color: '#151519',
              }}
            />
            <button
              type="submit"
              aria-label="검색"
              style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer' }}
            >
              <SearchIcon />
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 56, paddingTop: 25 }}>
          {/* 최근 검색어 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#222229' }}>
                최근 검색어
              </span>
              <button
                type="button"
                onClick={clearRecent}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1.5,
                  letterSpacing: '-0.02em',
                  color: '#27282c',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                전체삭제
              </button>
            </div>
            {recent.length === 0 ? (
              <span style={{ fontSize: 16, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#27282c', textAlign: 'center' }}>
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
                      padding: '8px 14px 8px 20px',
                      borderRadius: 24,
                      background: '#fff',
                      boxShadow: '0 0 8px rgba(21,21,21,0.04)',
                      fontSize: 14,
                      fontWeight: 500,
                      letterSpacing: '-0.02em',
                      color: '#5c5c72',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => submit(word)}
                      style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                    >
                      {word}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecent(word)}
                      aria-label={`${word} 삭제`}
                      style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                    >
                      <XIcon />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* 추천 검색어 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#222229' }}>
              추천 검색어
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {suggested.map((word) => (
                <Pill key={word} label={word} active={false} size="sm" onClick={() => submit(word)} />
              ))}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-label={expanded ? '추천 검색어 접기' : '추천 검색어 더 보기'}
                aria-expanded={expanded}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#f6f6fa',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <svg
                  width={19}
                  height={19}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                  style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                >
                  <path d="M7 10l5 5 5-5" stroke="#5c5c72" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
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
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
      {/* 딤 배경 */}
      <button
        type="button"
        onClick={onClose}
        aria-label="필터 닫기"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,.4)',
          border: 'none',
          padding: 0,
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
          borderRadius: '32px 32px 0 0',
          padding: '12px 20px calc(40px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          boxSizing: 'border-box',
          boxShadow: '0 0 16px rgba(63,63,63,0.04)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="시트 닫기"
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            justifyContent: 'center',
            padding: '2px 0 0',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ width: 42, height: 4, borderRadius: 999, background: 'var(--color-track)' }} />
        </button>

        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#474c52' }}>
          필터
        </h2>

        {/* 지역 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionTitle label="지역" />
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -20px', padding: '4px 20px' }}>
            <Pill label="전체" active={region === null} size="sm" onClick={() => onRegion(null)} />
            {REGIONS.map((r) => (
              <Pill key={r} label={r} active={region === r} size="sm" onClick={() => onRegion(r)} />
            ))}
          </div>
        </div>

        <Divider />

        {/* 진행 상태 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionTitle label="진행 상태" />
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -20px', padding: '4px 20px' }}>
            {SHEET_STATUS.map((s) => (
              <Pill key={s.key} label={s.label} active={statusKey === s.key} size="sm" onClick={() => onStatus(s.key)} />
            ))}
          </div>
        </div>

        <Divider />

        {/* 정렬 기준 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#222229' }}>
            정렬 기준
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 15,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: active ? '1.5px solid var(--color-accent)' : '1.5px solid #d5d8dd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      flexShrink: 0,
                    }}
                  >
                    {active && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent)' }} />}
                  </span>
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#5c5c72' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#a4a4bd' }}>
                      {opt.desc}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

/* ---------- 공용 소품 ---------- */

/** 알약 버튼. size sm(px20 py8) / xs(px12 py4). 활성 시 보라 채움. */
function Pill({
  label,
  active,
  size,
  onClick,
}: {
  label: string
  active: boolean
  size: 'sm' | 'xs'
  onClick: () => void
}) {
  const style: CSSProperties = {
    flexShrink: 0,
    padding: size === 'sm' ? '8px 20px' : '4px 12px',
    borderRadius: 24,
    border: 'none',
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '-0.02em',
    cursor: 'pointer',
    background: active ? 'var(--color-accent)' : '#fff',
    color: active ? '#fff' : '#5c5c72',
    boxShadow: '0 0 8px rgba(21,21,21,0.04)',
    WebkitTapHighlightColor: 'transparent',
  }
  return (
    <button type="button" onClick={onClick} aria-pressed={active} style={style}>
      {label}
    </button>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#222229' }}>
        {label}
      </span>
      <RightCaret />
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#e0e0ed' }} />
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 0 8px rgba(21,21,21,0.04)',
        padding: '40px 20px',
        textAlign: 'center',
        fontSize: 14,
        letterSpacing: '-0.02em',
        color: '#86869f',
      }}
    >
      {text}
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
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
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

function BackCaret() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14.5 6.5 9 12l5.5 5.5" stroke="#27282c" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RightCaret() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="#5c5c72" aria-hidden style={{ flexShrink: 0, transform: 'scaleX(-1)' }}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.0303 7.46967C14.3232 7.76256 14.3232 8.23744 14.0303 8.53033L10.5607 12L14.0303 15.4697C14.3232 15.7626 14.3232 16.2374 14.0303 16.5303C13.7374 16.8232 13.2626 16.8232 12.9697 16.5303L8.96967 12.5303C8.67678 12.2374 8.67678 11.7626 8.96967 11.4697L12.9697 7.46967C13.2626 7.17678 13.7374 7.17678 14.0303 7.46967Z"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="#5c5c72" aria-hidden style={{ flexShrink: 0 }}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.3851 15.4457C11.7348 17.5684 7.85537 17.4013 5.39858 14.9445C2.76254 12.3085 2.76254 8.03464 5.39858 5.3986C8.03462 2.76256 12.3085 2.76256 14.9445 5.3986C17.4013 7.85538 17.5684 11.7348 15.4457 14.3851L20.6014 19.5407C20.8943 19.8336 20.8943 20.3085 20.6014 20.6014C20.3085 20.8943 19.8336 20.8943 19.5407 20.6014L14.3851 15.4457ZM6.45924 13.8839C4.40899 11.8336 4.40899 8.50951 6.45924 6.45926C8.50949 4.40901 11.8336 4.40901 13.8839 6.45926C15.9326 8.50801 15.9341 11.8287 13.8884 13.8794C13.8869 13.8809 13.8854 13.8823 13.8838 13.8839C13.8823 13.8854 13.8808 13.8869 13.8794 13.8884C11.8287 15.9341 8.50799 15.9326 6.45924 13.8839Z"
      />
    </svg>
  )
}

/** Settings-adjust (필터) 아이콘 — 두 개의 슬라이더 바. */
function FilterIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8h9M17 8h3M4 16h3M11 16h9" stroke="#474c52" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={15} cy={8} r={2.2} stroke="#474c52" strokeWidth={1.8} />
      <circle cx={9} cy={16} r={2.2} stroke="#474c52" strokeWidth={1.8} />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="#a4a4bd" strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  )
}
