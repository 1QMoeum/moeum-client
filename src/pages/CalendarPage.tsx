import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '@/components/ui/BottomNav'
import { useCalendarMonth, useEventTimeline } from '@/hooks/calendar'
import { useHomeOnBack } from '@/hooks/useHomeOnBack'
import type { CalendarEntryDto, TimelineNodeDto } from '@/types/calendar'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

const won = (n: number) => n.toLocaleString('ko-KR')

const pad = (n: number) => String(n).padStart(2, '0')

/** Date → YYYY-MM-DD (서버 date 키와 동일 포맷) */
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** YYYY-MM-DD → YYYY.MM.DD */
const dotDate = (iso: string) => iso.replaceAll('-', '.')

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** 날짜 셀(주) 한 줄 높이(px) — 드래그 시 높이 보간 기준 */
const ROW_H = 52

/** 사용 계획 상태 → 칩 라벨. 모르는 코드는 그대로 노출. */
const STATUS_LABELS: Record<string, string> = {
  PENDING: '승인대기',
  EXECUTED: '증빙완료',
  CANCELLED: '취소됨',
  REFUNDED: '환불됨',
}
const statusLabel = (code: string) => STATUS_LABELS[code] ?? code

/** 카드 제목 — 서버 title 에 이벤트명이 없으면 앞에 붙여준다. */
const entryTitle = (e: CalendarEntryDto) =>
  e.title.includes(e.eventTitle) ? e.title : `${e.eventTitle} ${e.title}`

/** BUDGET(지출)은 핑크, 이벤트 시작/마감일은 보라. */
const entryColor = (type: CalendarEntryDto['type']) => (type === 'BUDGET' ? '#f23f83' : 'var(--color-accent)')

const entryKey = (e: CalendarEntryDto) => `${e.eventId}-${e.type}-${e.budgetId ?? e.date}`

/** 해당 월의 달력 그리드 (일요일 시작, 주 단위 배열). 앞뒤 인접월 날짜 포함. */
function monthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
  const weeks: Date[][] = []
  for (let i = 0; i < totalCells; i += 7) {
    weeks.push(Array.from({ length: 7 }, (_, j) => new Date(year, month, i + j + 1 - firstDay)))
  }
  return weeks
}

/**
 * 캘린더 — 참여 이벤트의 사용계획(지출)·시작/마감일 일정.
 * 주간(접힘) ↔ 월 전체(펼침) 토글, 날짜 선택 시 아래에 해당 일정 카드 목록.
 * 카드를 누르면 실시간 진행 타임라인이 lazy 조회로 펼쳐진다.
 */
export default function CalendarPage() {
  const navigate = useNavigate()
  useHomeOnBack()
  const today = useMemo(() => new Date(), [])
  const [selected, setSelected] = useState(today)
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [expanded, setExpanded] = useState(false)
  /** 핸들 드래그 진행 상태 (시작 Y, 이동량 px) */
  const [drag, setDrag] = useState<{ startY: number; delta: number } | null>(null)
  const [openCardKey, setOpenCardKey] = useState<string | null>(null)

  const yearMonth = `${view.year}-${pad(view.month + 1)}`
  const { data, isLoading, error } = useCalendarMonth(yearMonth)

  /** 날짜(YYYY-MM-DD) → 그 날의 항목들 */
  const entriesByDate = useMemo(() => {
    const map: Record<string, CalendarEntryDto[]> = {}
    for (const e of data?.entries ?? []) (map[e.date] ??= []).push(e)
    return map
  }, [data])

  const weeks = useMemo(() => monthGrid(view.year, view.month), [view])
  const selWeekIndex = Math.max(0, weeks.findIndex((w) => w.some((d) => sameDay(d, selected))))

  // 펼침 진행도 0(주간)~1(월 전체). 드래그 중엔 이동량을 비율로 반영하고, 놓으면 0/1로 스냅.
  const range = (weeks.length - 1) * ROW_H
  const base = expanded ? 1 : 0
  const progress = drag ? Math.min(1, Math.max(0, base + drag.delta / range)) : base

  const selectedKey = dayKey(selected)
  const entries = entriesByDate[selectedKey] ?? []

  const moveMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  const selectDay = (d: Date) => {
    setSelected(d)
    setOpenCardKey(null)
    if (d.getMonth() !== view.month) setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100%' }}>
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 140px' }}>
        {/* 탑바 */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconButton label="뒤로가기" onClick={() => navigate('/main')}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M14.5 6.5 9 12l5.5 5.5" stroke="#27282c" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </IconButton>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#27282c' }}>
              캘린더
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconButton label="알림">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="#5c5c72" aria-hidden>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3V3.75H10.4426C8.21751 3.75 6.37591 5.48001 6.23702 7.70074L6.01601 11.2342C5.93175 12.5814 5.47946 13.8797 4.7084 14.9876C4.01172 15.9886 4.63194 17.3712 5.84287 17.5165L9.25 17.9254V19C9.25 20.5188 10.4812 21.75 12 21.75C13.5188 21.75 14.75 20.5188 14.75 19V17.9254L18.1571 17.5165C19.3681 17.3712 19.9883 15.9886 19.2916 14.9876C18.5205 13.8797 18.0682 12.5814 17.984 11.2342L17.763 7.70074C17.6241 5.48001 15.7825 3.75 13.5574 3.75H13V3ZM10.75 19C10.75 19.6904 11.3096 20.25 12 20.25C12.6904 20.25 13.25 19.6904 13.25 19V18.25H10.75V19Z"
                />
              </svg>
            </IconButton>
            <IconButton label="내 정보" onClick={() => navigate('/mypage')}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="#5c5c72" aria-hidden>
                <path d="M12 3.75C9.92893 3.75 8.25 5.42893 8.25 7.5C8.25 9.57107 9.92893 11.25 12 11.25C14.0711 11.25 15.75 9.57107 15.75 7.5C15.75 5.42893 14.0711 3.75 12 3.75Z" />
                <path d="M8 13.25C5.92893 13.25 4.25 14.9289 4.25 17V18.1883C4.25 18.9415 4.79588 19.5837 5.53927 19.7051C9.8181 20.4037 14.1819 20.4037 18.4607 19.7051C19.2041 19.5837 19.75 18.9415 19.75 18.1883V17C19.75 14.9289 18.0711 13.25 16 13.25H15.6591C15.4746 13.25 15.2913 13.2792 15.1159 13.3364L14.2504 13.6191C12.7881 14.0965 11.2119 14.0965 9.74959 13.6191L8.88407 13.3364C8.70869 13.2792 8.52536 13.25 8.34087 13.25H8Z" />
              </svg>
            </IconButton>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '18px 20px 0' }}>
          {/* 캘린더 카드 */}
          <section
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '20px 12px 12px',
              boxShadow: '0 0 8px rgba(63,63,63,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {/* 월 네비게이션 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconButton label="이전 달" onClick={() => moveMonth(-1)}>
                <CaretSolid dir="left" />
              </IconButton>
              <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: '#27282c' }}>
                {view.month + 1}월
              </span>
              <IconButton label="다음 달" onClick={() => moveMonth(1)}>
                <CaretSolid dir="right" />
              </IconButton>
            </div>

            {/* 요일 헤더 + 날짜 그리드 */}
            <div style={{ width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    style={{
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#474c52',
                    }}
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* 월 전체를 항상 렌더하고, 높이·오프셋을 진행도로 보간해 주간↔월 전환 */}
              <div
                style={{
                  height: ROW_H + progress * range,
                  overflow: 'hidden',
                  transition: drag ? 'none' : 'height 0.25s ease',
                }}
              >
                <div
                  style={{
                    transform: `translateY(-${selWeekIndex * ROW_H * (1 - progress)}px)`,
                    transition: drag ? 'none' : 'transform 0.25s ease',
                  }}
                >
                  {weeks.map((week) => (
                    <div key={dayKey(week[0])} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                      {week.map((d) => (
                        <DayCell
                          key={dayKey(d)}
                          date={d}
                          inMonth={d.getMonth() === view.month}
                          isToday={sameDay(d, today)}
                          isSelected={sameDay(d, selected)}
                          dots={(entriesByDate[dayKey(d)] ?? []).map((e) => entryColor(e.type))}
                          onSelect={() => selectDay(d)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 펼침/접힘 핸들 — 드래그(위/아래)와 탭 모두 지원 */}
            <button
              type="button"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                setDrag({ startY: e.clientY, delta: 0 })
              }}
              onPointerMove={(e) => {
                const y = e.clientY
                setDrag((d) => (d ? { ...d, delta: y - d.startY } : d))
              }}
              onPointerUp={() => {
                if (!drag) return
                // 6px 미만 이동은 탭으로 간주해 토글, 그 외엔 드래그 진행도 기준 스냅
                if (Math.abs(drag.delta) < 6) setExpanded((v) => !v)
                else setExpanded(progress >= 0.5)
                setDrag(null)
              }}
              onPointerCancel={() => setDrag(null)}
              aria-label={expanded ? '캘린더 접기' : '캘린더 펼치기'}
              aria-expanded={expanded}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 24px',
                cursor: 'grab',
                display: 'flex',
                touchAction: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ width: 42, height: 4, borderRadius: 999, background: 'var(--color-track)', display: 'block' }} />
            </button>
          </section>

          {/* 선택 날짜 일정 */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#27282c' }}>
              {`${selected.getMonth() + 1}.${selected.getDate()}.${WEEKDAYS[selected.getDay()]}요일`}
            </h2>

            {isLoading ? (
              <div style={{ background: '#fff', borderRadius: 20, height: 120, boxShadow: '0 0 8px rgba(21,21,21,0.04)' }} />
            ) : error ? (
              <div
                style={{
                  background: '#fff5f5',
                  borderRadius: 20,
                  padding: 20,
                  color: '#e03e3e',
                  fontSize: 13.5,
                }}
              >
                {`${error.message} (${error.status ?? '?'})`}
              </div>
            ) : entries.length === 0 ? (
              <EmptySchedule />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {entries.map((entry) => (
                  <ScheduleCard
                    key={entryKey(entry)}
                    entry={entry}
                    dateKey={selectedKey}
                    open={openCardKey === entryKey(entry)}
                    onToggle={() =>
                      setOpenCardKey((cur) => (cur === entryKey(entry) ? null : entryKey(entry)))
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <BottomNav onCreate={() => navigate('/events/new')} />
    </div>
  )
}

/** 날짜 셀 — 오늘은 보라 볼드, 선택일은 연보라 원, 일정 있는 날은 하단 점 표시. */
function DayCell({
  date,
  inMonth,
  isToday,
  isSelected,
  dots,
  onSelect,
}: {
  date: Date
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
  dots: string[]
  onSelect: () => void
}) {
  const color = !inMonth ? '#9fa4a8' : isToday ? 'var(--color-accent)' : '#474c52'
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일`}
      aria-current={isSelected ? 'date' : undefined}
      style={{
        height: 52,
        background: 'none',
        border: 'none',
        padding: '8px 0 0',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          position: 'relative',
          width: 24,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: isToday ? 700 : 600,
          lineHeight: 1.4,
          color,
        }}
      >
        {isSelected && (
          <span
            aria-hidden
            style={{ position: 'absolute', inset: '-2px 0', borderRadius: '50%', background: '#dcd8ff' }}
          />
        )}
        <span style={{ position: 'relative' }}>{date.getDate()}</span>
      </span>
      <span style={{ display: 'flex', gap: 2, height: 5 }}>
        {dots.slice(0, 2).map((bg, i) => (
          <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: bg }} />
        ))}
      </span>
    </button>
  )
}

/** 일정 카드 — 누르면 해당 이벤트의 실시간 진행 타임라인을 조회해 아래로 펼친다. */
function ScheduleCard({
  entry,
  dateKey,
  open,
  onToggle,
}: {
  entry: CalendarEntryDto
  dateKey: string
  open: boolean
  onToggle: () => void
}) {
  const chips = [
    ...(entry.fundingComplete ? [] : ['입금 미완료']),
    ...(entry.executionStatus ? [statusLabel(entry.executionStatus)] : []),
  ]
  return (
    <div style={{ filter: 'drop-shadow(0 0 8px rgba(21,21,21,0.04))' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          background: '#fff',
          border: 'none',
          borderRadius: open ? '12px 12px 0 0' : 12,
          padding: 16,
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span
          aria-hidden
          style={{ width: 4, height: 84, borderRadius: 32, flexShrink: 0, background: entryColor(entry.type) }}
        />
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{ display: 'flex', gap: 8, minHeight: 21 }}>
            {chips.map((chip) => (
              <Chip key={chip} label={chip} variant="violet" />
            ))}
          </span>
          <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 500,
                lineHeight: 1.5,
                letterSpacing: '-0.02em',
                color: '#1c1d1f',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {entryTitle(entry)}
            </span>
            <svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="#5c5c72"
              aria-hidden
              style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.46967 9.96967C7.76256 9.67678 8.23744 9.67678 8.53033 9.96967L12 13.4393L15.4697 9.96967C15.7626 9.67678 16.2374 9.67678 16.5303 9.96967C16.8232 10.2626 16.8232 10.7374 16.5303 11.0303L12.5303 15.0303C12.2374 15.3232 11.7626 15.3232 11.4697 15.0303L7.46967 11.0303C7.17678 10.7374 7.17678 10.2626 7.46967 9.96967Z"
              />
            </svg>
          </span>
          {entry.amount != null && entry.amount > 0 && (
            <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.02em', color: 'var(--color-accent)' }}>
              {`${won(entry.amount)}원`}
            </span>
          )}
        </span>
      </button>

      {open && <TimelinePanel eventId={entry.eventId} dateKey={dateKey} />}
    </div>
  )
}

/**
 * 타임라인 노드를 생애주기 순서로 정렬한다.
 * 모금 시작일은 항상 처음, 모금 마감일은 항상 끝, 사용계획은 그 사이(집행예정일순).
 * (집행예정일이 마감일보다 뒤여도 마감일을 마지막에 둔다.)
 */
function orderTimeline(nodes: TimelineNodeDto[]): TimelineNodeDto[] {
  const rank = (t: string) => (t === 'EVENT_START' ? 0 : t === 'EVENT_END' ? 2 : 1)
  const ordered = [...nodes].sort((a, b) => {
    const r = rank(a.type) - rank(b.type)
    if (r !== 0) return r
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  })
  // 노드가 4개 이상이면 앵커(현재) 기준 3칸 창으로 슬라이드.
  if (ordered.length <= 3) return ordered
  const anchorIdx = ordered.findIndex((n) => n.anchor)
  const center = anchorIdx === -1 ? ordered.length - 1 : anchorIdx
  const start = Math.min(Math.max(center - 1, 0), ordered.length - 3)
  return ordered.slice(start, start + 3)
}

/** 실시간 진행 타임라인 패널 — 카드가 펼쳐질 때만 조회한다. */
function TimelinePanel({ eventId, dateKey }: { eventId: number; dateKey: string }) {
  const { data, isPending, error } = useEventTimeline(eventId, dateKey)
  const nodes = orderTimeline(data?.nodes ?? [])

  return (
    <div
      style={{
        background: '#f6f6fa',
        borderRadius: '0 0 20px 20px',
        padding: '16px 16px 20px',
        borderTop: '1px solid #ececf2',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#2f2f3b' }}>
        실시간 진행 타임라인
      </span>

      {isPending ? (
        <span style={{ fontSize: 14, color: '#9fa4a8' }}>불러오는 중…</span>
      ) : error ? (
        <span style={{ fontSize: 14, color: '#e03e3e' }}>{error.message}</span>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* 타임라인 세로 축 */}
          <span aria-hidden style={{ position: 'absolute', left: 3, top: 6, bottom: 6, width: 1, background: '#cacdd2' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {nodes.map((node, i) => (
              <TimelineRow key={`${node.date}-${node.budgetId ?? node.type}-${i}`} node={node} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TimelineRow({ node }: { node: TimelineNodeDto }) {
  const active = node.anchor
  const titleColor = active ? '#0c0d0d' : '#9fa4a8'
  // 시작/마감 노드는 이벤트 제목 대신 마일스톤 라벨로 표시(제목 중복 방지).
  const label =
    node.type === 'EVENT_START' ? '모금 시작일' : node.type === 'EVENT_END' ? '모금 마감일' : node.title
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          flexShrink: 0,
          position: 'relative',
          background: active ? 'var(--color-accent)' : '#cacdd2',
        }}
      />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: active ? 600 : 500,
                lineHeight: 1.5,
                letterSpacing: '-0.02em',
                color: titleColor,
              }}
            >
              {label}
            </span>
            {node.amount != null && node.amount > 0 && (
              <>
                <span aria-hidden style={{ width: 1, height: 12, background: '#cacdd2' }} />
                <span
                  style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.02em', color: titleColor }}
                >
                  {`${won(node.amount)}원`}
                </span>
              </>
            )}
          </span>
          <span style={{ fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.02em', color: active ? '#474c52' : '#9fa4a8' }}>
            {dotDate(node.date)}
          </span>
        </div>
        {node.status != null && (
          <Chip label={statusLabel(node.status)} variant={active ? 'violet' : 'gray'} />
        )}
      </div>
    </div>
  )
}

/** 선택한 날짜에 일정이 없을 때의 빈 상태 카드. */
function EmptySchedule() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: '32px 0',
        boxShadow: '0 0 8px rgba(21,21,21,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <img src="/calendar-empty.png" alt="" aria-hidden width={120} height={120} style={{ display: 'block' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#1c1d1f' }}>
          오늘 예정된 예산 집행이 없어요.
        </span>
        <span style={{ fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#474c52' }}>
          프로젝트 진행 현황을 확인해보세요!
        </span>
      </div>
    </div>
  )
}

function Chip({ label, variant }: { label: string; variant: 'violet' | 'gray' }) {
  return (
    <span
      style={{
        padding: '0 8px',
        borderRadius: 4,
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
        background: variant === 'violet' ? '#e3e1ff' : '#f6f6fa',
        color: variant === 'violet' ? 'var(--color-accent)' : '#86869f',
      }}
    >
      {label}
    </span>
  )
}

/** Solid 캐럿 (월 이동). dir=right 는 좌우 반전. */
function CaretSolid({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="#5c5c72"
      aria-hidden
      style={{ transform: dir === 'right' ? 'scaleX(-1)' : 'none' }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.0303 7.46967C14.3232 7.76256 14.3232 8.23744 14.0303 8.53033L10.5607 12L14.0303 15.4697C14.3232 15.7626 14.3232 16.2374 14.0303 16.5303C13.7374 16.8232 13.2626 16.8232 12.9697 16.5303L8.96967 12.5303C8.67678 12.2374 8.67678 11.7626 8.96967 11.4697L12.9697 7.46967C13.2626 7.17678 13.7374 7.17678 14.0303 7.46967Z"
      />
    </svg>
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
