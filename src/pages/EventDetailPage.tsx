import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bell,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MoreVertical,
  Pencil,
  Share2,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import {
  useDeletePost,
  useEventBudgets,
  useEventDetail,
  useEventPosts,
  useEventSettlement,
} from '@/hooks/events'
import { useAuthStore } from '@/store/auth'
import { getUserIdFromToken } from '@/lib/jwt'
import { ErrorCode } from '@/constants/errorCodes'
import Button from '@/components/ui/Button'
import BudgetEditor from '@/components/events/BudgetEditor'
import NoticeComposer from '@/components/events/NoticeComposer'
import EventEditor from '@/components/events/EventEditor'
import type { BudgetItem, BudgetStatus, EventDetailResponse, EventPost } from '@/types/event'

/* ===== 디자인 토큰 (Figma: 금사빠_moeum) ===== */
const BG = '#fafafa'
const VIOLET = '#665bf7'
const VIOLET_BG = '#e3e1ff'
const AQUA = '#15beb4'
const INK900 = '#151519'
const INK800 = '#27282c'
const INK700 = '#2f2f3b'
const GRAY600 = '#5c5c72'
const GRAY500 = '#86869f'
const GRAY300 = '#c9c9df'
const GRAY50 = '#f6f6fa'
const LINE = '#eaebed'
const CARD_SHADOW = '0 2px 12px rgba(21, 21, 21, 0.05)'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
/** 2026-06-24 → 26.06.24 */
const shortDate = (d: string) => d.replaceAll('-', '.').slice(2)
/** 2026-06-24 → 2026.06.24 */
const dotDate = (d: string) => d.replaceAll('-', '.')
/** 모금률 → 정수 %. 서버가 비율(0.33)로 주면 100 곱하고, 이미 %(33)면 그대로. */
const toPercent = (rate: number) => Math.round(rate <= 1 ? rate * 100 : rate)
/** "HH:mm:ss" | null → "HH:mm" (없으면 빈 문자열) */
const hm = (t: string | null) => (t ? t.slice(0, 5) : '')

/** endDate(YYYY-MM-DD)까지 남은 일수. 지났으면 0. */
function daysLeft(endDate: string): number {
  const end = new Date(`${endDate}T23:59:59`).getTime()
  if (Number.isNaN(end)) return 0
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000))
}

type Tab = 'intro' | 'budget' | 'notice' | 'settlement'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'intro', label: '이벤트 소개' },
  { key: 'budget', label: '사용 계획' },
  { key: 'notice', label: '공지' },
  { key: 'settlement', label: '정산 내역' },
]

/**
 * 이벤트 상세 (참여 전/후 공용). 상단 공통 헤더(진행률 링·통계) + 4개 탭.
 * 총대(생성자)는 우상단 메뉴로 수정/공유/삭제, 사용 계획 편집이 가능하다.
 */
export default function EventDetailPage() {
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()
  const accessToken = useAuthStore((s) => s.accessToken)

  const id = eventId ? Number(eventId) : null
  const validId = id !== null && Number.isFinite(id)
  const { data: event, isPending, error, refetch, isFetching } = useEventDetail(validId ? id : null)

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  const notFound = !validId || error?.status === ErrorCode.EVENT_NOT_FOUND

  return (
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {!notFound && event ? (
          <EventView
            event={event}
            onBack={() => navigate(-1)}
            onParticipate={() => navigate(`/events/${event.eventId}/participate`)}
          />
        ) : (
          <>
            <TopBar onBack={() => navigate(-1)} />
            {isPending && validId && <DetailSkeleton />}
            {notFound && <NotFound onBack={() => navigate('/explore')} />}
            {!notFound && error && (
              <div style={{ padding: '0 20px' }}>
                <ErrorState
                  message={`${error.message} (${error.status ?? '?'})`}
                  onRetry={() => void refetch()}
                  retrying={isFetching}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

/* ===== 상단 바 ===== */
function TopBar({ onBack, right }: { onBack: () => void; right?: ReactNode }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: BG,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로"
        style={iconBtnStyle}
      >
        <ChevronLeft size={26} color={INK800} />
      </button>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: INK800, letterSpacing: '-0.02em' }}>
        이벤트 상세
      </h1>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>{right}</div>
    </header>
  )
}

/* ===== 로드된 상세 (헤더 + 탭 + 콘텐츠) ===== */
function EventView({
  event,
  onBack,
  onParticipate,
}: {
  event: EventDetailResponse
  onBack: () => void
  onParticipate: () => void
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [tab, setTab] = useState<Tab>('intro')
  const [liked, setLiked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingEvent, setEditingEvent] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const isOwner = getUserIdFromToken(accessToken) === event.creatorId
  const ongoing = event.status === 'ONGOING'
  const dday = daysLeft(event.endDate)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: event.title, url: window.location.href })
      else {
        await navigator.clipboard?.writeText(window.location.href)
        setToast('링크를 복사했어요')
      }
    } catch {
      /* 사용자 취소/미지원 — 무시 */
    }
  }

  const startEdit = () => {
    setMenuOpen(false)
    setEditingEvent(true)
  }

  return (
    <>
      <TopBar
        onBack={onBack}
        right={
          <>
            <button type="button" aria-label="알림" style={iconBtnStyle}>
              <Bell size={22} color={INK800} fill={INK800} />
            </button>
            {isOwner && (
              <button
                type="button"
                aria-label="더보기"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                style={iconBtnStyle}
              >
                <MoreVertical size={22} color={INK800} />
              </button>
            )}
          </>
        }
      />

      {/* 총대 메뉴 (수정/공유/삭제) */}
      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMenuOpen(false)} />
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 56,
              right: 12,
              zIndex: 31,
              minWidth: 176,
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 8px 28px rgba(21,21,21,0.14)',
              padding: 6,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <MenuItem icon={<Pencil size={18} />} label="수정하기" onClick={startEdit} />
            <MenuItem
              icon={<Share2 size={18} />}
              label="공유하기"
              onClick={() => {
                setMenuOpen(false)
                void share()
              }}
            />
            <MenuItem
              icon={<Trash2 size={18} color="#fa5252" />}
              label="삭제하기"
              danger
              onClick={() => {
                setMenuOpen(false)
                setToast('삭제 기능은 곧 제공될 예정이에요')
              }}
            />
          </div>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 108 }}>
        <Header event={event} dday={dday} ongoing={ongoing} />

        {/* 탭 */}
        <nav
          style={{
            display: 'flex',
            position: 'sticky',
            top: 52,
            zIndex: 10,
            background: BG,
            borderBottom: `1px solid ${LINE}`,
            margin: '4px 0 20px',
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                style={{
                  all: 'unset',
                  flex: 1,
                  textAlign: 'center',
                  padding: '15px 0',
                  fontSize: 16,
                  fontWeight: 500,
                  color: active ? INK900 : GRAY300,
                  borderBottom: `2px solid ${active ? INK900 : 'transparent'}`,
                  marginBottom: -1,
                  cursor: 'pointer',
                  letterSpacing: '-0.02em',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '0 20px' }}>
          {tab === 'intro' && <IntroTab event={event} />}
          {tab === 'budget' && (
            <BudgetTab event={event} isOwner={isOwner} onEdit={() => setEditing(true)} />
          )}
          {tab === 'notice' && <NoticeTab event={event} isOwner={isOwner} />}
          {tab === 'settlement' && <SettlementTab event={event} />}
        </div>
      </div>

      {/* 하단 고정 액션 바 */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderTop: `1px solid ${LINE}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px calc(14px + env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
          zIndex: 15,
        }}
      >
        <IconBtn label="찜" onClick={() => setLiked((v) => !v)}>
          <Heart size={22} strokeWidth={2.2} color={liked ? '#fa5252' : GRAY500} fill={liked ? '#fa5252' : 'none'} />
        </IconBtn>
        <IconBtn label="공유" onClick={() => void share()}>
          <Share2 size={21} strokeWidth={2.2} color={GRAY500} />
        </IconBtn>
        <Button
          variant="solid"
          onClick={onParticipate}
          disabled={!ongoing}
          style={{ flex: 1, background: ongoing ? VIOLET : undefined, borderRadius: 32 }}
        >
          {ongoing ? '이벤트 참여하기' : '진행 중인 모금이 아니에요'}
        </Button>
      </div>

      {editing && (
        <BudgetEditorGate event={event} onClose={() => setEditing(false)} />
      )}

      {editingEvent && <EventEditor event={event} onClose={() => setEditingEvent(false)} />}

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 96,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            background: 'rgba(21,21,25,0.92)',
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 500,
            padding: '11px 18px',
            borderRadius: 999,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          {toast}
        </div>
      )}
    </>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        all: 'unset',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '11px 12px',
        borderRadius: 10,
        cursor: 'pointer',
        color: danger ? '#fa5252' : INK800,
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: '-0.01em',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span>{label}</span>
      <span style={{ display: 'flex', color: danger ? '#fa5252' : GRAY500 }}>{icon}</span>
    </button>
  )
}

/* ===== 공통 헤더 (진행률 링 + 통계) ===== */
function Header({ event, dday, ongoing }: { event: EventDetailResponse; dday: number; ongoing: boolean }) {
  const pct = toPercent(event.fundingRate)
  const rate = Math.min(pct, 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '12px 20px 4px' }}>
      {/* 타이틀 + 금액 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: INK900, letterSpacing: '-0.02em', textAlign: 'center' }}>
          {event.title}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {ongoing && <Chip>{`D-${dday}`}</Chip>}
          <span style={{ fontSize: 14, color: GRAY500, letterSpacing: '-0.01em' }}>
            목표 {won(event.targetAmount)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: '#0c0d0d',
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {event.currentAmount.toLocaleString('ko-KR')}
          </span>
          <span style={{ fontSize: 24, fontWeight: 500, color: INK800 }}>원</span>
        </div>
      </div>

      {/* 진행률 링 + 대표 이미지 */}
      <div
        style={{
          width: 216,
          height: 216,
          borderRadius: '50%',
          background: `conic-gradient(${VIOLET} ${rate * 3.6}deg, #ececf4 0deg)`,
          padding: 9,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#f1f3f5',
            border: `5px solid ${BG}`,
            boxSizing: 'border-box',
          }}
        >
          {event.representativeImageUrl && (
            <img
              src={event.representativeImageUrl}
              alt={event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>
      </div>

      {/* 원 아래 소개 문구 */}
      {event.description && (
        <p
          style={{
            margin: 0,
            maxWidth: 220,
            textAlign: 'center',
            fontSize: 14,
            color: GRAY600,
            letterSpacing: '-0.01em',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {event.description}
        </p>
      )}

      {event.creatorHanaVerified && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12.5,
            fontWeight: 600,
            color: '#12b886',
            letterSpacing: '-0.01em',
          }}
        >
          <ShieldCheck size={15} strokeWidth={2.4} />
          하나은행 본인인증 총대
        </span>
      )}

      {/* 통계 카드 */}
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          background: '#fff',
          borderRadius: 24,
          boxShadow: CARD_SHADOW,
          padding: '16px 8px',
        }}
      >
        <Stat label="참여자" value={`${event.participantCount}명`} />
        <StatDivider />
        <Stat label="달성률" value={`${pct}%`} />
        <StatDivider />
        <Stat label="마감일" value={shortDate(event.endDate)} />
      </section>
    </div>
  )
}

/* ===== 이벤트 소개 탭 ===== */
function IntroTab({ event }: { event: EventDetailResponse }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionTitle>이벤트 소개</SectionTitle>
      <Card gap={24}>
        {event.representativeImageUrl && (
          <img
            src={event.representativeImageUrl}
            alt={event.title}
            style={{ width: '100%', borderRadius: 8, display: 'block' }}
          />
        )}
        {event.description && (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#474c52', letterSpacing: '-0.01em', whiteSpace: 'pre-wrap' }}>
            {event.description}
          </p>
        )}

        <Hr />
        <InfoBlock label="이벤트 날짜" value={`${dotDate(event.startDate)} ~ ${dotDate(event.endDate)}`} />

        {event.operatingStartTime && event.operatingEndTime && (
          <>
            <Hr />
            <InfoBlock label="진행 시간" value={`${hm(event.operatingStartTime)} ~ ${hm(event.operatingEndTime)}`} />
          </>
        )}

        <Hr />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={infoLabelStyle}>진행 장소</span>
          <LocationBlock event={event} />
        </div>
      </Card>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={infoLabelStyle}>{label}</span>
      <span style={{ fontSize: 15, color: '#6a717d', letterSpacing: '-0.01em' }}>{value}</span>
    </div>
  )
}

function LocationBlock({ event }: { event: EventDetailResponse }) {
  const region = [event.siDo, event.siGunGu, event.legalDong].filter(Boolean).join(' ')
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        background: GRAY50,
        borderRadius: 12,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: VIOLET_BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <MapPin size={18} color={VIOLET} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: INK700, letterSpacing: '-0.01em' }}>{region || '장소 미정'}</span>
        {event.address && (
          <span style={{ fontSize: 13, color: GRAY500, letterSpacing: '-0.01em' }}>{event.address}</span>
        )}
      </div>
    </div>
  )
}

/* ===== 사용 계획 탭 ===== */
/** 사용 계획 항목 상태 → 집행 내역 칩(라벨·색). */
const EXEC_CHIP: Record<BudgetStatus, { label: string; color: string; bg: string }> = {
  EXECUTED: { label: '증빙완료', color: VIOLET, bg: VIOLET_BG },
  PENDING: { label: '승인대기', color: GRAY500, bg: GRAY50 },
  REFUNDED: { label: '환불완료', color: AQUA, bg: '#e3f8f6' },
  CANCELLED: { label: '취소', color: GRAY300, bg: GRAY50 },
}

function BudgetTab({
  event,
  isOwner,
  onEdit,
}: {
  event: EventDetailResponse
  isOwner: boolean
  onEdit: () => void
}) {
  const { data, isPending, error, refetch, isFetching } = useEventBudgets(event.eventId)

  if (isPending) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 56, borderRadius: 12, background: '#eef0f3' }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState
        message={`${error.message} (${error.status ?? '?'})`}
        onRetry={() => void refetch()}
        retrying={isFetching}
      />
    )
  }

  const items = data?.items ?? []
  const totalAmount = data?.totalAmount ?? 0
  const executed = items.filter((i) => i.status !== 'CANCELLED')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 총 목표 금액 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle>총 목표 금액</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: INK800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {event.targetAmount.toLocaleString('ko-KR')}
            </span>
            <span style={{ fontSize: 16, fontWeight: 500, color: GRAY600 }}>원</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: INK700, letterSpacing: '-0.01em' }}>
            모금한 금액은 아래와 같은 계획으로 사용할 예정입니다.
          </p>
        </div>
      </div>

      {/* 예상 사용 계획 */}
      <Card gap={20} radius={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: INK900, letterSpacing: '-0.01em' }}>예상 사용 계획</span>
          {isOwner && (
            <button type="button" onClick={onEdit} aria-label="사용 계획 편집" style={{ ...iconBtnStyle, width: 28, height: 28 }}>
              <Pencil size={20} color={INK800} />
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            text="아직 등록된 사용 계획이 없어요."
            action={
              isOwner ? (
                <Button variant="solid" onClick={onEdit} style={{ width: 'auto', padding: '11px 22px', fontSize: 14, background: VIOLET, borderRadius: 24 }}>
                  사용 계획 추가하기
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* 표 헤더 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: GRAY50,
                borderRadius: 6,
                padding: '5px 12px',
              }}
            >
              <span style={{ fontSize: 14, color: GRAY600, letterSpacing: '-0.01em' }}>항목</span>
              <span style={{ fontSize: 14, color: GRAY600, letterSpacing: '-0.01em' }}>예상 금액 (원)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', padding: '0 4px' }}>
              {items.map((item, i) => (
                <div key={item.budgetId}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 8px' }}>
                    <span
                      style={{
                        fontSize: 14,
                        color: item.status === 'CANCELLED' ? GRAY300 : INK900,
                        letterSpacing: '-0.01em',
                        textDecoration: item.status === 'CANCELLED' ? 'line-through' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginRight: 12,
                      }}
                    >
                      {item.title}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#0c0d0d', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                        {item.amount.toLocaleString('ko-KR')}
                      </span>
                      <span style={{ fontSize: 14, color: INK700 }}>원</span>
                    </span>
                  </div>
                  {i < items.length - 1 && <div style={{ height: 1, background: LINE }} />}
                </div>
              ))}
            </div>

            {/* 총 합계 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: INK900, letterSpacing: '-0.01em' }}>총 합계</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 600, color: VIOLET, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {totalAmount.toLocaleString('ko-KR')}
                </span>
                <span style={{ fontSize: 14, color: INK700 }}>원</span>
              </span>
            </div>
          </>
        )}
      </Card>

      {/* 집행 내역 */}
      {executed.length > 0 && (
        <Card gap={20} radius={12}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: INK800, letterSpacing: '-0.01em' }}>집행 내역</span>
            <span style={{ fontSize: 14, color: INK800, letterSpacing: '-0.01em' }}>총 {executed.length}건</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {executed.map((item, i) => (
              <div key={item.budgetId}>
                <ExecutionRow item={item} />
                {i < executed.length - 1 && <div style={{ height: 1, background: LINE, margin: '20px 0' }} />}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function ExecutionRow({ item }: { item: BudgetItem }) {
  const chip = EXEC_CHIP[item.status] ?? EXEC_CHIP.PENDING
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: INK900, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: GRAY600, letterSpacing: '-0.01em' }}>{dotDate(item.scheduledDate)}</span>
          <span style={{ width: 1, height: 12, background: LINE }} />
          <span style={{ fontSize: 14, color: GRAY600, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>{won(item.amount)}</span>
        </div>
      </div>
      <span
        style={{
          flexShrink: 0,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 500,
          color: chip.color,
          background: chip.bg,
          letterSpacing: '-0.01em',
        }}
      >
        {chip.label}
      </span>
    </div>
  )
}

/* ===== 공지 탭 ===== */
/** ISO 8601 → "6월 24일" */
function monthDay(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function NoticeTab({ event, isOwner }: { event: EventDetailResponse; isOwner: boolean }) {
  const [composing, setComposing] = useState(false)
  const [editing, setEditing] = useState<EventPost | null>(null)
  const { data, isPending, error, refetch, isFetching } = useEventPosts(event.eventId)
  const deleteMut = useDeletePost(event.eventId)

  const posts = data?.content ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionTitle>공지</SectionTitle>
        {isOwner && (
          <button
            type="button"
            onClick={() => setComposing(true)}
            style={{
              all: 'unset',
              background: VIOLET,
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              padding: '4px 12px',
              borderRadius: 24,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: '0 2px 8px rgba(102,91,247,0.25)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            글쓰기
          </button>
        )}
      </div>

      {isPending ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ height: 132, borderRadius: 20, background: '#eef0f3' }} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          message={`${error.message} (${error.status ?? '?'})`}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      ) : posts.length === 0 ? (
        <Card gap={12} radius={20}>
          <EmptyState text="아직 등록된 공지가 없어요." sub="총대가 카페 계약·영수증 등 소식을 이곳에 남깁니다." />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.map((post) => (
            <NoticeCard
              key={post.postId}
              post={post}
              isOwner={isOwner}
              onEdit={() => setEditing(post)}
              onDelete={() => {
                if (window.confirm('이 공지를 삭제할까요?')) deleteMut.mutate(post.postId)
              }}
            />
          ))}
        </div>
      )}

      {composing && <NoticeComposer eventId={event.eventId} onClose={() => setComposing(false)} />}
      {editing && (
        <NoticeComposer eventId={event.eventId} post={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function NoticeCard({
  post,
  isOwner,
  onEdit,
  onDelete,
}: {
  post: EventPost
  isOwner: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const imgs = post.imageUrls ?? []

  return (
    <div style={{ background: '#fff', borderRadius: 20, boxShadow: CARD_SHADOW, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* 작성자 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${VIOLET} 0%, #9b93ff 100%)`,
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              총
            </div>
            <span style={{ fontSize: 14, color: INK800, letterSpacing: '-0.01em' }}>총대</span>
            <span style={{ fontSize: 14, color: GRAY500, letterSpacing: '-0.01em' }}>{monthDay(post.createdAt)}</span>
          </div>
          {isOwner && (
            <div style={{ position: 'relative' }}>
              <button type="button" aria-label="공지 메뉴" onClick={() => setMenuOpen((v) => !v)} style={{ ...iconBtnStyle, width: 28, height: 28 }}>
                <MoreVertical size={20} color={GRAY500} />
              </button>
              {menuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMenuOpen(false)} />
                  <div
                    role="menu"
                    style={{
                      position: 'absolute',
                      top: 30,
                      right: 0,
                      zIndex: 31,
                      minWidth: 128,
                      background: '#fff',
                      borderRadius: 12,
                      boxShadow: '0 8px 28px rgba(21,21,21,0.14)',
                      padding: 6,
                    }}
                  >
                    <MenuItem
                      icon={<Pencil size={17} />}
                      label="수정하기"
                      onClick={() => {
                        setMenuOpen(false)
                        onEdit()
                      }}
                    />
                    <MenuItem
                      icon={<Trash2 size={17} color="#fa5252" />}
                      label="삭제하기"
                      danger
                      onClick={() => {
                        setMenuOpen(false)
                        onDelete()
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 제목 + 내용 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: INK900, letterSpacing: '-0.01em' }}>{post.title}</span>
          <p style={{ margin: 0, fontSize: 14, color: GRAY600, letterSpacing: '-0.01em', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>
        </div>
      </div>

      {/* 첨부 이미지 */}
      {imgs.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: imgs.length === 1 ? '1fr' : '1fr 1fr',
            gap: 12,
          }}
        >
          {imgs.map((url, i) => (
            <img
              key={`${url}-${i}`}
              src={url}
              alt=""
              style={{
                width: '100%',
                aspectRatio: imgs.length === 1 ? '337 / 180' : '1 / 1',
                objectFit: 'cover',
                borderRadius: 12,
                display: 'block',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ===== 정산 내역 탭 ===== */
type SettleFilter = 'all' | 'in' | 'out'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 정산 거래 한 줄 (입금/출금 통합). */
type Tx = {
  id: string
  kind: 'in' | 'out'
  name: string
  memo: string
  amount: number
  refunded: boolean
  time: string
  dayKey: string
  dayLabel: string
  monthLabel: string
  ts: number
}

/** ISO → 시각·일자 라벨. */
function txParts(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    dayKey: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
    dayLabel: `${d.getMonth() + 1}.${d.getDate()} (${WEEKDAYS[d.getDay()]})`,
    monthLabel: `${d.getFullYear()}.${pad(d.getMonth() + 1)}`,
    ts: d.getTime(),
  }
}

function SettlementTab({ event }: { event: EventDetailResponse }) {
  const [filter, setFilter] = useState<SettleFilter>('all')
  const { data, isPending, error, refetch, isFetching } = useEventSettlement(event.eventId)

  if (isPending) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 64, borderRadius: 12, background: '#eef0f3' }} />
        {[0, 1].map((i) => (
          <div key={i} style={{ height: 84, borderRadius: 20, background: '#eef0f3' }} />
        ))}
      </div>
    )
  }

  if (error) {
    // 미참여(4001) — 에러 대신 안내 빈 상태
    if (error.status === ErrorCode.EVENT_NOT_PARTICIPATED) {
      return (
        <Card gap={12} radius={20}>
          <EmptyState text="참여 후 정산 내역을 볼 수 있어요." sub="이 이벤트에 참여하면 입금·집행 내역이 공개됩니다." />
        </Card>
      )
    }
    return (
      <ErrorState
        message={`${error.message} (${error.status ?? '?'})`}
        onRetry={() => void refetch()}
        retrying={isFetching}
      />
    )
  }

  const deposits = data?.deposits ?? []
  const executions = data?.executions ?? []
  const totalDeposit = data?.totalDeposit ?? 0
  const totalExecuted = data?.totalExecuted ?? 0
  const refund = deposits.filter((d) => d.status === 'REFUNDED').reduce((s, d) => s + d.amount, 0)
  const remaining = Math.max(0, totalDeposit - totalExecuted - refund)

  // 통합 거래 목록
  const txs: Tx[] = [
    ...deposits.map((d, i) => {
      const p = txParts(d.date)
      return { id: `d${i}`, kind: 'in' as const, name: d.name, memo: '모금 참여', amount: d.amount, refunded: d.status === 'REFUNDED', ...p }
    }),
    ...executions.map((e, i) => {
      const p = txParts(e.executedAt)
      return { id: `e${i}`, kind: 'out' as const, name: e.title, memo: '집행', amount: e.amount, refunded: false, ...p }
    }),
  ]

  const filtered = txs
    .filter((t) => filter === 'all' || (filter === 'in' ? t.kind === 'in' : t.kind === 'out'))
    .sort((a, b) => b.ts - a.ts)

  // 일자별 그룹
  const groups: Array<{ dayLabel: string; items: Tx[] }> = []
  let curKey = ''
  for (const t of filtered) {
    if (t.dayKey !== curKey) {
      groups.push({ dayLabel: t.dayLabel, items: [] })
      curKey = t.dayKey
    }
    groups[groups.length - 1].items.push(t)
  }

  const monthLabel = filtered[0]?.monthLabel ?? dotDate(event.startDate).slice(0, 7)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 전체 요약 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SectionTitle>전체 요약</SectionTitle>
        <div style={{ display: 'flex', gap: 8 }}>
          <SummaryCard label="총 모금액" value={won(totalDeposit)} />
          <SummaryCard label="총 집행액" value={won(totalExecuted)} />
          <SummaryCard label="환불 예정액" value={won(refund)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: INK900, letterSpacing: '-0.01em' }}>잔여 금액</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#0c0d0d', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
              {remaining.toLocaleString('ko-KR')}
            </span>
            <span style={{ fontSize: 14, color: INK700 }}>원</span>
          </span>
        </div>
      </div>

      {/* 필터 토글 */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', borderRadius: 24, boxShadow: CARD_SHADOW, padding: 4 }}>
          {([
            { key: 'all', label: '전체' },
            { key: 'in', label: '입금' },
            { key: 'out', label: '출금' },
          ] as Array<{ key: SettleFilter; label: string }>).map((f) => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  all: 'unset',
                  padding: '8px 20px',
                  borderRadius: 24,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  color: active ? '#fff' : INK700,
                  background: active ? VIOLET : 'transparent',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 월 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: INK800, letterSpacing: '-0.02em' }}>{monthLabel}</span>
        <ChevronRight size={22} color={GRAY500} />
      </div>

      {groups.length === 0 ? (
        <Card gap={12} radius={20}>
          <EmptyState text="거래 내역이 아직 없어요." sub="모금 참여(입금)와 집행(출금) 내역이 이곳에 표시됩니다." />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {groups.map((g) => (
            <div key={g.dayLabel} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: GRAY600, letterSpacing: '-0.01em' }}>{g.dayLabel}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {g.items.map((t) => (
                  <div key={t.id} style={{ background: '#fff', borderRadius: 20, boxShadow: CARD_SHADOW, padding: '20px 16px' }}>
                    <SettleRow tx={t} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SettleRow({ tx }: { tx: Tx }) {
  const isIn = tx.kind === 'in'
  const color = isIn ? VIOLET : AQUA
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isIn ? <ArrowDown size={16} color="#fff" /> : <ArrowUp size={16} color="#fff" />}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: INK800, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tx.name}
          </span>
          {tx.refunded && (
            <span style={{ flexShrink: 0, padding: '1px 7px', borderRadius: 4, fontSize: 12, fontWeight: 500, color: GRAY500, background: GRAY50, letterSpacing: '-0.01em' }}>
              환불됨
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 14, color: GRAY500, letterSpacing: '-0.01em' }}>
          <span>{tx.memo}</span>
          <span>{tx.time}</span>
        </div>
      </div>
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: tx.refunded ? GRAY500 : color,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          flexShrink: 0,
          textDecoration: tx.refunded ? 'line-through' : 'none',
        }}
      >
        {isIn ? '+' : '-'}
        {won(tx.amount)}
      </span>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#fff',
        borderRadius: 12,
        boxShadow: CARD_SHADOW,
        padding: '16px 6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 13, color: GRAY600, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: 14.5, fontWeight: 600, color: INK900, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  )
}

/* ===== 재사용 프리미티브 ===== */
function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: VIOLET_BG,
        color: VIOLET,
        fontSize: 14,
        fontWeight: 500,
        padding: '0 8px',
        borderRadius: 4,
        letterSpacing: '-0.01em',
        lineHeight: 1.5,
      }}
    >
      {children}
    </span>
  )
}

function Card({ children, gap = 16, radius = 12 }: { children: ReactNode; gap?: number; radius?: number }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: radius,
        boxShadow: CARD_SHADOW,
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap,
      }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 16, fontWeight: 500, color: INK800, letterSpacing: '-0.01em' }}>{children}</span>
}

function Hr() {
  return <div style={{ height: 1, background: LINE }} />
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 14, color: GRAY600, letterSpacing: '-0.01em' }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 600, color: INK900, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  )
}

function StatDivider() {
  return <div style={{ width: 1, height: 24, background: LINE }} />
}

function EmptyState({ text, sub, action }: { text: string; sub?: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 12px', textAlign: 'center' }}>
      <span style={{ fontSize: 14.5, color: GRAY500, letterSpacing: '-0.01em' }}>{text}</span>
      {sub && <span style={{ fontSize: 12.5, color: GRAY300, letterSpacing: '-0.01em', lineHeight: 1.5 }}>{sub}</span>}
      {action}
    </div>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        all: 'unset',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 12,
        cursor: 'pointer',
        flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

const iconBtnStyle: CSSProperties = {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 12,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
}

const infoLabelStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 500,
  color: INK800,
  letterSpacing: '-0.01em',
}

/** 사용 계획 편집 모달 — 모금 시작 여부(currentAmount>0)를 넘겨 잠금 규칙을 적용한다. */
function BudgetEditorGate({ event, onClose }: { event: EventDetailResponse; onClose: () => void }) {
  const { data } = useEventBudgets(event.eventId)
  return (
    <BudgetEditor
      eventId={event.eventId}
      items={data?.items ?? []}
      fundingStarted={event.currentAmount > 0}
      onClose={onClose}
    />
  )
}

/* ===== 상태 화면 ===== */
function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 20px' }}>
      <div style={{ height: 22, width: '60%', borderRadius: 8, background: '#eef0f3' }} />
      <div style={{ height: 32, width: '50%', borderRadius: 8, background: '#eef0f3' }} />
      <div style={{ width: 216, height: 216, borderRadius: '50%', background: '#eef0f3' }} />
      <div style={{ height: 72, width: '100%', borderRadius: 24, background: '#eef0f3' }} />
    </div>
  )
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        margin: '24px 20px',
        background: '#fff',
        borderRadius: 20,
        boxShadow: CARD_SHADOW,
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <AlertCircle size={36} strokeWidth={2} color={GRAY300} />
      <div style={{ fontSize: 17, fontWeight: 700, color: INK900, letterSpacing: '-0.02em' }}>이벤트를 찾을 수 없어요</div>
      <p style={{ margin: 0, fontSize: 14, color: GRAY500, letterSpacing: '-0.01em' }}>삭제되었거나 잘못된 주소예요.</p>
      <Button variant="solid" onClick={onBack} style={{ width: 'auto', padding: '12px 28px', marginTop: 4, background: VIOLET, borderRadius: 24 }}>
        탐색으로 가기
      </Button>
    </div>
  )
}

function ErrorState({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying: boolean }) {
  return (
    <div
      style={{
        margin: '24px 0',
        background: '#fff',
        borderRadius: 20,
        boxShadow: CARD_SHADOW,
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
      }}
    >
      <AlertCircle size={36} strokeWidth={2} color="#e03e3e" />
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: GRAY600, letterSpacing: '-0.01em' }}>{message}</p>
      <Button variant="solid" onClick={onRetry} disabled={retrying} style={{ width: 'auto', padding: '12px 28px', background: VIOLET, borderRadius: 24 }}>
        {retrying ? '불러오는 중…' : '다시 시도'}
      </Button>
    </div>
  )
}
