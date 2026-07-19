import type { CSSProperties } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Banknote,
  Bell,
  CalendarClock,
  ChevronLeft,
  Megaphone,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/notification'
import { useAuthStore } from '@/store/auth'
import type { NotificationSummary, NotificationType } from '@/types/notification'

const VIOLET = '#665bf7'
const INK800 = '#27282c'
const INK900 = '#151519'
const GRAY500 = '#86869f'

const AQUA = '#15beb4'

/** 알림 종류별 아이콘 + 원형 배경 — 레이아웃은 토스 참고, 색은 서비스 팔레트(바이올렛·아쿠아·레드)만 사용 */
const TYPE_STYLE: Record<NotificationType, { icon: typeof Bell; bg: string; fg: string }> = {
  CHARGE_SUCCESS: { icon: Wallet, bg: '#e2f8f6', fg: AQUA },
  WITHDRAW_SUCCESS: { icon: Banknote, bg: '#e2f8f6', fg: AQUA },
  PARTICIPATION: { icon: Users, bg: '#e3e1ff', fg: VIOLET },
  BUDGET_DUE: { icon: CalendarClock, bg: '#e3e1ff', fg: VIOLET },
  EXECUTION: { icon: Receipt, bg: '#e3e1ff', fg: VIOLET },
  REFUND: { icon: RotateCcw, bg: '#ffebee', fg: '#fa5252' },
  POST_CREATED: { icon: Megaphone, bg: '#e3e1ff', fg: VIOLET },
}

/** LocalDateTime → 상대 시간(1시간 전) 또는 날짜(YY.MM.DD) */
function timeLabel(createdAt: string): string {
  const t = new Date(createdAt).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Date.now() - t
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}시간 전`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day}일 전`
  return createdAt.slice(2, 10).replaceAll('-', '.')
}

/**
 * 알림함 — 토스 알림 창 스타일. 흰 배경 풀-너비 행, 좌측 파스텔 원형 아이콘,
 * "종류 · 시간" 메타 라인 + 본문. 읽은 알림은 텍스트를 흐리게 가라앉힌다.
 * 항목 탭 → 읽음 처리 후 관련 이벤트가 있으면 상세로 이동. 우상단 "모두 읽음".
 */
export default function NotificationPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)

  const { data, isPending, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications()
  const { data: unread } = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  if (!accessToken) {
    return <Navigate to="/" replace />
  }

  const items = data?.pages.flatMap((p) => p.content) ?? []
  const unreadCount = unread?.count ?? 0

  const onSelect = (n: NotificationSummary) => {
    if (!n.isRead) markRead.mutate(n.notificationId)
    if (n.eventId != null) navigate(`/events/${n.eventId}`)
  }

  return (
    <main style={{ minHeight: '100dvh', background: '#fff' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 32 }}>
        {/* 상단 바 */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: '#fff',
          }}
        >
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로" style={iconBtnStyle}>
            <ChevronLeft size={26} color={INK800} />
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: INK800, letterSpacing: '-0.02em' }}>
            알림
          </h1>
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={unreadCount === 0 || markAllRead.isPending}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              padding: '6px 4px',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: unreadCount === 0 ? '#c9c9df' : VIOLET,
              cursor: unreadCount === 0 ? 'default' : 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            모두 읽음
          </button>
        </header>

        {isPending && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 20px' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#f2f3f6', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                  <div style={{ height: 12, width: '40%', borderRadius: 6, background: '#f2f3f6' }} />
                  <div style={{ height: 14, width: '80%', borderRadius: 6, background: '#f2f3f6' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p style={{ padding: '24px 20px', fontSize: 14, color: GRAY500 }}>
            알림을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {/* 고정 공지 — 모든 유저에게 항상 노출 (클라이언트 고정) */}
        {!isPending && <PinnedNotice />}

        {!isPending && !error && items.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: '80px 20px 0',
              color: GRAY500,
            }}
          >
            <Bell size={40} strokeWidth={1.6} color="#d5d5e4" />
            <p style={{ margin: 0, fontSize: 15, letterSpacing: '-0.01em' }}>새로운 알림이 없어요</p>
          </div>
        )}

        {items.length > 0 && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
            {items.map((n) => (
              <NotificationRow key={n.notificationId} item={n} onSelect={() => onSelect(n)} />
            ))}
          </ul>
        )}

        {hasNextPage && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0' }}>
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 500,
                color: GRAY500,
                letterSpacing: '-0.01em',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {isFetchingNextPage ? '불러오는 중…' : '알림 더 보기'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

/**
 * 상단 고정 공지 — 서버 알림과 무관하게 모든 유저에게 항상 노출.
 * 서비스 핵심(에스크로 보관·블록체인 투명 기록)을 안내한다.
 */
function PinnedNotice() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 20px',
        background: '#f8f8fd',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: '#e3e1ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ShieldCheck size={20} strokeWidth={2} color={VIOLET} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 1 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: GRAY500, letterSpacing: '-0.01em' }}>
          <span>공지</span>
          <span aria-hidden>·</span>
          <span
            style={{
              padding: '0 6px',
              borderRadius: 4,
              background: '#e3e1ff',
              color: VIOLET,
              fontSize: 11,
              fontWeight: 600,
              lineHeight: '18px',
            }}
          >
            고정
          </span>
        </span>
        <span style={{ fontSize: 15, fontWeight: 500, color: INK900, letterSpacing: '-0.02em', lineHeight: 1.5, wordBreak: 'keep-all' }}>
          모든 모금액은 이벤트별 에스크로 지갑에 안전하게 보관되고, 사용 내역은 블록체인에 투명하게 기록돼요.
        </span>
      </span>
    </div>
  )
}

function NotificationRow({ item, onSelect }: { item: NotificationSummary; onSelect: () => void }) {
  const { icon: Icon, bg, fg } = TYPE_STYLE[item.type] ?? { icon: Bell, bg: '#f2f3f6', fg: GRAY500 }
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        style={{
          all: 'unset',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          width: '100%',
          padding: '14px 20px',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* 파스텔 원형 아이콘 — 읽어도 색은 유지(토스), 텍스트만 가라앉힌다 */}
        <span
          style={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} strokeWidth={2} color={fg} />
        </span>

        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 1 }}>
          {/* 메타 라인 — "종류 · 시간" */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: GRAY500, letterSpacing: '-0.01em' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.title}
            </span>
            <span aria-hidden style={{ flexShrink: 0 }}>·</span>
            <span style={{ flexShrink: 0 }}>{timeLabel(item.createdAt)}</span>
            {!item.isRead && (
              <span
                aria-label="읽지 않음"
                style={{ flexShrink: 0, marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: VIOLET }}
              />
            )}
          </span>
          {/* 본문 — 미읽음은 진하게, 읽음은 흐리게 */}
          <span
            style={{
              fontSize: 15,
              fontWeight: item.isRead ? 400 : 500,
              color: item.isRead ? GRAY500 : INK900,
              letterSpacing: '-0.02em',
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}
          >
            {item.message}
          </span>
        </span>
      </button>
    </li>
  )
}

const iconBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 4,
  display: 'flex',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
}
