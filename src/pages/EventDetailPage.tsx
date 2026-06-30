import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, AlertCircle, Heart, Share2, ShieldCheck } from 'lucide-react'
import { useEventDetail } from '@/hooks/events'
import { useAuthStore } from '@/store/auth'
import { ErrorCode } from '@/constants/errorCodes'
import { categoryMeta } from '@/lib/mapPin'
import Button from '@/components/ui/Button'
import type { EventDetailResponse } from '@/types/event'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

/** endDate(YYYY-MM-DD)까지 남은 일수. 지났으면 0. */
function daysLeft(endDate: string): number {
  const end = new Date(`${endDate}T23:59:59`).getTime()
  if (Number.isNaN(end)) return 0
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000))
}

type Tab = 'intro' | 'budget' | 'board'

/**
 * 이벤트 단건 상세(참여 전). 원형 진행률 + 통계 + 탭(소개/사용계획/게시판).
 * 없으면(4000) 빈 상태. 하단 "프로젝트 참여하기" → 참여 화면으로 이동.
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
    <main style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: event && !notFound ? '8px 0 0' : '8px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* 상단 바 */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 8, padding: '8px 20px 0' }}>
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
            이벤트 상세
          </h1>
        </header>

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

        {!notFound && event && <EventView event={event} onParticipate={() => navigate(`/events/${event.eventId}/participate`)} />}
      </div>
    </main>
  )
}

function EventView({ event, onParticipate }: { event: EventDetailResponse; onParticipate: () => void }) {
  const [tab, setTab] = useState<Tab>('intro')
  const [liked, setLiked] = useState(false)
  const meta = categoryMeta(event.category)
  const rate = Math.min(event.fundingRate, 100)
  const ongoing = event.status === 'ONGOING'
  const dday = daysLeft(event.endDate)

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: event.title, url: window.location.href })
    } catch {
      /* 사용자 취소/미지원 — 무시 */
    }
  }

  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, padding: '12px 20px 120px' }}>
        {/* 타이틀 + 금액 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#191f28', letterSpacing: '-0.02em' }}>
            {event.title}
          </h2>
          <span style={{ fontSize: 13, color: '#8b95a1', letterSpacing: '-0.01em' }}>
            {ongoing ? `D-${dday} · ` : ''}목표 {won(event.targetAmount)}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: '#191f28',
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {event.currentAmount.toLocaleString('ko-KR')}
            </span>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#191f28' }}>원</span>
          </div>
        </div>

        {/* 원형 진행률 + 대표 이미지 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: `conic-gradient(${meta.color} ${rate * 3.6}deg, #ededf2 0deg)`,
              padding: 8,
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
                border: '4px solid #fff',
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
        </div>

        {event.creatorHanaVerified && (
          <span
            style={{
              alignSelf: 'center',
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
            background: '#f9fafb',
            borderRadius: 18,
            padding: '16px 8px',
          }}
        >
          <Stat label="달성률" value={`${event.fundingRate}%`} highlight color={meta.color} />
          <Divider />
          <Stat label="목표 금액" value={won(event.targetAmount)} />
          <Divider />
          <Stat label="진행일" value={event.startDate.replaceAll('-', '.').slice(2)} />
        </section>

        {/* 탭 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #ededf2' }}>
          {(
            [
              { key: 'intro', label: '이벤트 소개' },
              { key: 'budget', label: '사용 계획' },
              { key: 'board', label: '게시판' },
            ] as Array<{ key: Tab; label: string }>
          ).map((t) => {
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
                  padding: '12px 0',
                  fontSize: 14.5,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#191f28' : '#adb5bd',
                  borderBottom: `2px solid ${active ? '#8B5CF6' : 'transparent'}`,
                  marginBottom: -1,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'intro' && <IntroTab event={event} />}
        {tab === 'budget' && <PlaceholderTab text="사용 계획은 준비 중이에요." />}
        {tab === 'board' && <PlaceholderTab text="게시판은 준비 중이에요." />}
      </div>

      {/* 하단 고정 바 */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderTop: '1px solid #ededf2',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px calc(14px + env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
        }}
      >
        <IconBtn label="찜" onClick={() => setLiked((v) => !v)}>
          <Heart size={22} strokeWidth={2.2} color={liked ? '#fa5252' : '#8b95a1'} fill={liked ? '#fa5252' : 'none'} />
        </IconBtn>
        <IconBtn label="공유" onClick={() => void share()}>
          <Share2 size={21} strokeWidth={2.2} color="#8b95a1" />
        </IconBtn>
        <Button variant="solid" onClick={onParticipate} disabled={!ongoing} style={{ flex: 1 }}>
          {ongoing ? '프로젝트 참여하기' : '진행 중인 모금이 아니에요'}
        </Button>
      </div>
    </>
  )
}

function IntroTab({ event }: { event: EventDetailResponse }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: '#191f28', letterSpacing: '-0.01em' }}>
        이벤트 소개
      </span>
      {event.representativeImageUrl && (
        <img
          src={event.representativeImageUrl}
          alt={event.title}
          style={{ width: '100%', borderRadius: 16, display: 'block' }}
        />
      )}
      {event.description && (
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#3a4149', letterSpacing: '-0.01em', whiteSpace: 'pre-wrap' }}>
          {event.description}
        </p>
      )}

      <div style={{ height: 1, background: '#f1f3f5' }} />

      <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <InfoLine label="목표금액" value={won(event.targetAmount)} />
        <InfoLine label="날짜" value={`${event.startDate} ~ ${event.endDate}`} />
        <InfoLine label="장소" value={`${event.siDo} ${event.siGunGu} ${event.legalDong}`} sub={event.address} />
      </dl>
    </div>
  )
}

function InfoLine({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <dt style={{ width: 64, flexShrink: 0, fontSize: 14, color: '#8b95a1', letterSpacing: '-0.01em' }}>{label}</dt>
      <dd style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: '#191f28', letterSpacing: '-0.01em' }}>{value}</span>
        {sub && <span style={{ fontSize: 12.5, color: '#adb5bd', letterSpacing: '-0.01em' }}>{sub}</span>}
      </dd>
    </div>
  )
}

function PlaceholderTab({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 20px', color: '#adb5bd', fontSize: 14 }}>
      {text}
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
  color,
}: {
  label: string
  value: string
  highlight?: boolean
  color?: string
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 12.5, color: '#8b95a1', letterSpacing: '-0.01em' }}>{label}</span>
      <span
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: highlight ? color : '#191f28',
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, alignSelf: 'stretch', background: '#ededf2', margin: '2px 0' }} />
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
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

function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 20px' }}>
      <div style={{ height: 22, width: '60%', borderRadius: 8, background: '#eef0f3' }} />
      <div style={{ height: 32, width: '50%', borderRadius: 8, background: '#eef0f3' }} />
      <div style={{ width: 220, height: 220, borderRadius: '50%', background: '#eef0f3' }} />
      <div style={{ height: 72, width: '100%', borderRadius: 18, background: '#eef0f3' }} />
    </div>
  )
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        margin: '24px 0',
        background: '#f9fafb',
        borderRadius: 20,
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <AlertCircle size={36} strokeWidth={2} color="#adb5bd" />
      <div style={{ fontSize: 17, fontWeight: 700, color: '#191f28', letterSpacing: '-0.02em' }}>
        이벤트를 찾을 수 없어요
      </div>
      <p style={{ margin: 0, fontSize: 14, color: '#8b95a1', letterSpacing: '-0.01em' }}>
        삭제되었거나 잘못된 주소예요.
      </p>
      <Button variant="solid" onClick={onBack} style={{ width: 'auto', padding: '12px 28px', marginTop: 4 }}>
        탐색으로 가기
      </Button>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string
  onRetry: () => void
  retrying: boolean
}) {
  return (
    <div
      style={{
        margin: '24px 0',
        background: '#f9fafb',
        borderRadius: 20,
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
      }}
    >
      <AlertCircle size={36} strokeWidth={2} color="#e03e3e" />
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#6b7684', letterSpacing: '-0.01em' }}>
        {message}
      </p>
      <Button variant="solid" onClick={onRetry} disabled={retrying} style={{ width: 'auto', padding: '12px 28px' }}>
        {retrying ? '불러오는 중…' : '다시 시도'}
      </Button>
    </div>
  )
}
