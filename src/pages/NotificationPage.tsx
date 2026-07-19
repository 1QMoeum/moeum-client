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

const BG = '#fafafa'
const VIOLET = '#665bf7'
const INK800 = '#27282c'
const INK900 = '#151519'
const GRAY500 = '#86869f'
const GRAY600 = '#5c5c72'

/** 알림 종류별 아이콘 */
const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  CHARGE_SUCCESS: Wallet,
  WITHDRAW_SUCCESS: Banknote,
  PARTICIPATION: Users,
  BUDGET_DUE: CalendarClock,
  EXECUTION: Receipt,
  REFUND: RotateCcw,
  POST_CREATED: Megaphone,
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
 * 알림함. 최신순 목록 + 무한스크롤(더보기).
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
    <main style={{ minHeight: '100dvh', background: BG }}>
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
            background: BG,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 20px' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ height: 76, borderRadius: 16, background: '#eef0f3' }} />
            ))}
          </div>
        )}

        {error && (
          <p style={{ padding: '24px 20px', fontSize: 14, color: GRAY500 }}>
            알림을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {!isPending && !error && items.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: '120px 20px 0',
              color: GRAY500,
            }}
          >
            <Bell size={40} strokeWidth={1.6} color="#c9c9df" />
            <p style={{ margin: 0, fontSize: 15, letterSpacing: '-0.01em' }}>아직 알림이 없어요</p>
          </div>
        )}

        {items.length > 0 && (
          <ul style={{ margin: 0, padding: '4px 20px 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((n) => (
              <NotificationRow key={n.notificationId} item={n} onSelect={() => onSelect(n)} />
            ))}
          </ul>
        )}

        {hasNextPage && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 0' }}>
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              style={{
                background: '#fff',
                border: 'none',
                borderRadius: 20,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 500,
                color: GRAY600,
                boxShadow: '0 0 8px rgba(21,21,21,0.04)',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {isFetchingNextPage ? '불러오는 중…' : '더 보기'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function NotificationRow({ item, onSelect }: { item: NotificationSummary; onSelect: () => void }) {
  const Icon = TYPE_ICON[item.type] ?? Bell
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
          gap: 12,
          width: '100%',
          padding: '14px 16px',
          borderRadius: 16,
          background: item.isRead ? '#fff' : '#f1f0ff',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: item.isRead ? '#f3f3f8' : '#e3e1ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} strokeWidth={2} color={item.isRead ? GRAY500 : VIOLET} />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: INK900,
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.title}
            </span>
            <span style={{ flexShrink: 0, marginLeft: 'auto', fontSize: 12, color: GRAY500 }}>
              {timeLabel(item.createdAt)}
            </span>
          </span>
          <span style={{ fontSize: 14, color: GRAY600, letterSpacing: '-0.01em', lineHeight: 1.5, wordBreak: 'break-word' }}>
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
